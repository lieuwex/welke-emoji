/* global m */
const MAX_INCORRECT = 4;
const LOCALSTORAGE_ITEM_KEY = 'welke-emoji-state';

const genSeed = () => Math.floor(Math.random() * 1000000);

class vm {
	static init() {
		this.isPlaying = m.prop(false);
		this.gameOver = m.prop(false);
		this.previousEmoji = m.prop('');
		this.current = m.prop(0);
		this.incorrect = m.prop(0);

		this.seed = genSeed();
	}
	static reset() {
		vm.isPlaying(false);
		vm.gameOver(false);
		vm.previousEmoji('');
		vm.current(0);
		vm.incorrect(0);
		vm.saveState();

		vm.seed = genSeed();
	}
	static playAgain() {
		vm.gameOver(false);
		vm.previousEmoji('');
		vm.current(0);
		vm.incorrect(0);
		vm.saveState();

		vm.seed = genSeed();
	}

	static start() {
		vm.isPlaying(true);
	}

	static getAudioPath() {
		return `/audio/${vm.seed}${vm.current()}`
	}

	static getEmoji(callback) {
		m.startComputation();

		const req = new XMLHttpRequest();
		req.open('GET', `/emoji/${vm.seed}${vm.current()}`, true);
		req.onreadystatechange = () => {
			callback(req);
			m.endComputation();
		}

		req.send();
	}

	static guess(emoji, callback) {
		m.startComputation();

		const req = new XMLHttpRequest();
		req.open('POST', `/check/${vm.seed}${vm.current()}`, true);
		req.onreadystatechange = () => {
			callback(req);
			m.endComputation();
		}

		req.send(emoji);
	}

	static addIncorrect() {
		vm.incorrect(vm.incorrect() + 1)
		if (vm.incorrect() >= MAX_INCORRECT) {
			vm.gameOver(true);
			vm.saveState();
		}
	}

	// I don't really like the way we handle saving the state.

	static loadState(state) {
		const obj = JSON.parse(state);
		vm.isPlaying(obj.isPlaying);
		vm.gameOver(false);
		vm.previousEmoji(obj.previousEmoji)
		vm.current(obj.current);
		vm.incorrect(obj.incorrect);
		vm.seed = obj.seed;
	}

	static serializeState() {
		return JSON.stringify({
			isPlaying: vm.isPlaying(),
			previousEmoji: vm.previousEmoji(),
			current: vm.current(),
			incorrect: vm.incorrect(),
			seed: vm.seed,
		})
	}

	static saveState() {
		if (vm.gameOver() || !vm.isPlaying()) {
			localStorage.removeItem(LOCALSTORAGE_ITEM_KEY);
		} else {
			localStorage.setItem(LOCALSTORAGE_ITEM_KEY, vm.serializeState());
		}
	}
};

const scoreCounters = function () {
	return m('div#counters', [
		m('div#correct', vm.current()-vm.incorrect() + ' 👍'),
		m('div#incorrect', vm.incorrect() + ' 👎'),
	]);
};

const previousEmoji = function () {
	const prev = vm.previousEmoji()
	return m('div#previousEmoji', m('div', prev === '' ? '' : `vorige: ${prev}`));
};

const view = function () {
	let content;

	if (vm.gameOver()) {
		content = m('div#center', [
			'game over',
			scoreCounters(),
			m('button', { onclick: vm.playAgain }, 'Play again'),
		]);
	} else if (vm.isPlaying()) {
		content = m('div#center', [
			m('button#audioButton', {
				onclick: (e) => {
					const audio = e.target.lastChild;
					audio.currentTime = 0;
					audio.play();
				},
			}, [
				'Speel af',
				m('audio', { src: vm.getAudioPath(), autoplay: true }),
			]),
			scoreCounters(),
			previousEmoji(),
			m('input[type="text"]', {
				value: '',
				placeholder: 'emoji',
				autofocus: true,
				onkeydown: (e) => {
					const val = event.target.value.trim()
					if (e.keyCode !== 13 || val.length === 0) return;
					vm.guess(val, function (req) {
						if (req.readyState !== 4 || req.status !== 200) return;

						if (req.response === '0') {
							vm.addIncorrect();
							vm.getEmoji(function (req) {
								vm.previousEmoji(req.response);
								vm.saveState();
							});
						} else {
							vm.previousEmoji(val);
							vm.saveState();
						}

						vm.current(vm.current() + 1);
					});
				},
			}),
		]);
	} else {
		content = m('button#startbutton', { onclick: vm.start }, 'start')
	}

	return content;
};

vm.init();
const state = localStorage.getItem(LOCALSTORAGE_ITEM_KEY);
if (state != null) {
	vm.loadState(state);
}
m.mount(document.getElementById('content'), { view });

document.getElementById('logo').addEventListener('click', function () {
	m.startComputation();
	vm.reset();
	m.endComputation();
});
