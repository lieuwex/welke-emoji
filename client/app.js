/* global m */
var MAX_INCORRECT = 4;
var LOCALSTORAGE_ITEM_KEY = 'welke-emoji-state';

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
		var req = new XMLHttpRequest();
		req.open('POST', `/check/${vm.seed}${vm.current()}`, true);
		req.onreadystatechange = () => {
			if (req.readyState !== 4 || req.status !== 200) return;

			if (req.response === '0') {
				vm.addIncorrect();
			}

			vm.current(this.current() + 1);
			vm.saveState();
			m.endComputation();
		}

		m.startComputation();
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
		var obj = JSON.parse(state);
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

var shell = function (content) {
	return [
			m('div#header', [
				m('div#logo', {
					onclick: vm.reset,
				}, [
					'welke-emoji 😄',
				]),
			]),
			m('div#content', content),
	];
};

var view = function () {
	console.log('view()')
	var items = [];

	if (vm.gameOver()) {
		items = [
			'game over',
			m('button', { onclick: vm.playAgain }, 'Play again'),
		];
	} else if (vm.isPlaying()) {
		items = m('div#center', [
			m('button#audioButton', {
				onclick: (e) => {
					var audio = e.target.lastChild;
					audio.pause();
					audio.play();
				},
			}, [
				'Speel af',
				m('audio', { src: vm.getAudioPath(), autoplay: true }),
			]),
			m('div#current', vm.current()-vm.incorrect() + ' 👍'),
			m('div#incorrectwrong', vm.incorrect() + ' 👎'),
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
		items = [
			m('button#startbutton', { onclick: vm.start }, 'start')
		];
	}

	return shell(items);
};

vm.init();
var state = localStorage.getItem(LOCALSTORAGE_ITEM_KEY);
if (state != null) {
	vm.loadState(state);
}
m.mount(document.getElementById('container'), { view });
