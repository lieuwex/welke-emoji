/* global m */
const MAX_INCORRECT = 4;
const LOCALSTORAGE_ITEM_KEY = 'welke-emoji-state';

class vm {
	static init() {
		this.isPlaying = m.prop(false);
		this.gameOver = m.prop(false);
		this.current = m.prop(0);
		this.incorrect = m.prop(0);

		this.seed = Math.floor(Math.random() * 100);
	}
	static reset() {
		vm.isPlaying(false);
		vm.gameOver(false);
		vm.current(0);
		vm.incorrect(0);
		vm.saveState();

		vm.seed = Math.floor(Math.random() * 100);
	}
	static playAgain() {
		vm.gameOver(false);
		vm.current(0);
		vm.incorrect(0);
		vm.saveState();

		vm.seed = Math.floor(Math.random() * 100);
	}

	static start() {
		vm.isPlaying(true);
	}

	static getAudioPath() {
		return `/audio/${vm.seed}${vm.current()}`
	}

	static guess(emoji) {
		m.startComputation();

		var req = new XMLHttpRequest();
		req.open('POST', `/check/${vm.seed}${vm.current()}`, true);
		req.onreadystatechange = () => {
			if (req.readyState === 4 && req.status === 200) {
				if (req.response === '0') {
					vm.addIncorrect();
				}

				vm.current(this.current() + 1);
				vm.saveState();
			}

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
		vm.current(obj.current);
		vm.incorrect(obj.incorrect);
		vm.seed = obj.seed;
	}

	static serializeState() {
		return JSON.stringify({
			isPlaying: vm.isPlaying(),
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

const shell = function (content) {
	return [
			m('div#header', [
				m('div#logo', {
					onclick: vm.reset,
				}, [
					'welke emoji 😄',
				]),
			]),
			m('div#content', content),
	];
};

const scoreCounters = function () {
	return m('div#counters', [
		m('div#correct', vm.current()-vm.incorrect() + ' 👍'),
		m('div#incorrect', vm.incorrect() + ' 👎'),
	]);
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
			m('input[type="text"]', {
				value: '',
				placeholder: 'emoji',
				autofocus: true,
				onkeydown: (e) => {
					var val = event.target.value.trim()
					if (e.keyCode === 13 && val.length > 0) {
						vm.guess(val);
					}
				},
			}),
		]);
	} else {
		content = m('button#startbutton', { onclick: vm.start }, 'start')
	}

	return shell(content);
};

vm.init();
const state = localStorage.getItem(LOCALSTORAGE_ITEM_KEY);
if (state != null) {
	vm.loadState(state);
}
m.mount(document.getElementById('container'), { view });
