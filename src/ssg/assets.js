export class AssetRegistry {
	constructor() {
		this._assets = new Set();
	}

	register(assets) {
		let memo = this._assets;
		if (!Array.isArray(assets)) {
			memo.add(assets.source);
			return assets.uri;
		}

		return assets.map(({ source, uri }) => {
			memo.add(source); // XXX: ideally we'd want to move this into converters?
			return uri;
		});
	}

	*[Symbol.iterator]() {
		yield* this._assets;
	}
}
