export class AssetRegistry {
	constructor() {
		this._assets = new Set();
	}

	register(assets) {
		if(!Array.isArray(assets)) {
			this._assets.add(assets.source);
			return assets.uri;
		}

		let memo = this._assets;
		return assets.map(({ source, uri }) => {
			memo.add(source); // XXX: ideally we'd want to move this into converters?
			return uri;
		});
	}

	* [Symbol.iterator]() {
		yield* this._assets;
	}
}
