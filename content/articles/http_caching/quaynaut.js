(function () {
'use strict';

if(typeof global === "undefined" && typeof window !== "undefined") {
	window.global = window;
}

global.Prism = {
	manual: true
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var prism = createCommonjsModule(function (module) {
var _self = (typeof window !== 'undefined')
	? window
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self
		: {}
	);
var Prism = (function(){
var lang = /\blang(?:uage)?-([\w-]+)\b/i;
var uniqueId = 0;
var _ = _self.Prism = {
	manual: _self.Prism && _self.Prism.manual,
	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},
		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},
		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},
		clone: function (o, visited) {
			var type = _.util.type(o);
			visited = visited || {};
			switch (type) {
				case 'Object':
					if (visited[_.util.objId(o)]) {
						return visited[_.util.objId(o)];
					}
					var clone = {};
					visited[_.util.objId(o)] = clone;
					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key], visited);
						}
					}
					return clone;
				case 'Array':
					if (visited[_.util.objId(o)]) {
						return visited[_.util.objId(o)];
					}
					var clone = [];
					visited[_.util.objId(o)] = clone;
					o.forEach(function (v, i) {
						clone[i] = _.util.clone(v, visited);
					});
					return clone;
			}
			return o;
		}
	},
	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);
			for (var key in redef) {
				lang[key] = redef[key];
			}
			return lang;
		},
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			if (arguments.length == 2) {
				insert = arguments[1];
				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}
				return grammar;
			}
			var ret = {};
			for (var token in grammar) {
				if (grammar.hasOwnProperty(token)) {
					if (token == before) {
						for (var newToken in insert) {
							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}
					ret[token] = grammar[token];
				}
			}
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});
			return root[inside] = ret;
		},
		DFS: function(o, callback, type, visited) {
			visited = visited || {};
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);
					if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, null, visited);
					}
					else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},
	highlightAll: function(async, callback) {
		_.highlightAllUnder(document, async, callback);
	},
	highlightAllUnder: function(container, async, callback) {
		var env = {
			callback: callback,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};
		_.hooks.run("before-highlightall", env);
		var elements = env.elements || container.querySelectorAll(env.selector);
		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},
	highlightElement: function(element, async, callback) {
		var language, grammar, parent = element;
		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}
		if (parent) {
			language = (parent.className.match(lang) || [,''])[1].toLowerCase();
			grammar = _.languages[language];
		}
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		if (element.parentNode) {
			parent = element.parentNode;
			if (/pre/i.test(parent.nodeName)) {
				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			}
		}
		var code = element.textContent;
		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};
		_.hooks.run('before-sanity-check', env);
		if (!env.code || !env.grammar) {
			if (env.code) {
				_.hooks.run('before-highlight', env);
				env.element.textContent = env.code;
				_.hooks.run('after-highlight', env);
			}
			_.hooks.run('complete', env);
			return;
		}
		_.hooks.run('before-highlight', env);
		if (async && _self.Worker) {
			var worker = new Worker(_.filename);
			worker.onmessage = function(evt) {
				env.highlightedCode = evt.data;
				_.hooks.run('before-insert', env);
				env.element.innerHTML = env.highlightedCode;
				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			};
			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);
			_.hooks.run('before-insert', env);
			env.element.innerHTML = env.highlightedCode;
			callback && callback.call(element);
			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
		}
	},
	highlight: function (text, grammar, language) {
		var env = {
			code: text,
			grammar: grammar,
			language: language
		};
		_.hooks.run('before-tokenize', env);
		env.tokens = _.tokenize(env.code, env.grammar);
		_.hooks.run('after-tokenize', env);
		return Token.stringify(_.util.encode(env.tokens), env.language);
	},
	matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
		var Token = _.Token;
		for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}
			if (token == target) {
				return;
			}
			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];
			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					greedy = !!pattern.greedy,
					lookbehindLength = 0,
					alias = pattern.alias;
				if (greedy && !pattern.pattern.global) {
					var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
					pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
				}
				pattern = pattern.pattern || pattern;
				for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {
					var str = strarr[i];
					if (strarr.length > text.length) {
						return;
					}
					if (str instanceof Token) {
						continue;
					}
					if (greedy && i != strarr.length - 1) {
						pattern.lastIndex = pos;
						var match = pattern.exec(text);
						if (!match) {
							break;
						}
						var from = match.index + (lookbehind ? match[1].length : 0),
						    to = match.index + match[0].length,
						    k = i,
						    p = pos;
						for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
							p += strarr[k].length;
							if (from >= p) {
								++i;
								pos = p;
							}
						}
						if (strarr[i] instanceof Token) {
							continue;
						}
						delNum = k - i;
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						pattern.lastIndex = 0;
						var match = pattern.exec(str),
							delNum = 1;
					}
					if (!match) {
						if (oneshot) {
							break;
						}
						continue;
					}
					if(lookbehind) {
						lookbehindLength = match[1] ? match[1].length : 0;
					}
					var from = match.index + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    to = from + match.length,
					    before = str.slice(0, from),
					    after = str.slice(to);
					var args = [i, delNum];
					if (before) {
						++i;
						pos += before.length;
						args.push(before);
					}
					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);
					args.push(wrapped);
					if (after) {
						args.push(after);
					}
					Array.prototype.splice.apply(strarr, args);
					if (delNum != 1)
						_.matchGrammar(text, strarr, grammar, i, pos, true, token);
					if (oneshot)
						break;
				}
			}
		}
	},
	tokenize: function(text, grammar, language) {
		var strarr = [text];
		var rest = grammar.rest;
		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}
			delete grammar.rest;
		}
		_.matchGrammar(text, strarr, grammar, 0, 0, false);
		return strarr;
	},
	hooks: {
		all: {},
		add: function (name, callback) {
			var hooks = _.hooks.all;
			hooks[name] = hooks[name] || [];
			hooks[name].push(callback);
		},
		run: function (name, env) {
			var callbacks = _.hooks.all[name];
			if (!callbacks || !callbacks.length) {
				return;
			}
			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};
var Token = _.Token = function(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	this.length = (matchedStr || "").length|0;
	this.greedy = !!greedy;
};
Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}
	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}
	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};
	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}
	_.hooks.run('wrap', env);
	var attributes = Object.keys(env.attributes).map(function(name) {
		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}).join(' ');
	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';
};
if (!_self.document) {
	if (!_self.addEventListener) {
		return _self.Prism;
	}
	if (!_.disableWorkerMessageHandler) {
		_self.addEventListener('message', function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code,
				immediateClose = message.immediateClose;
			_self.postMessage(_.highlight(code, _.languages[lang], lang));
			if (immediateClose) {
				_self.close();
			}
		}, false);
	}
	return _self.Prism;
}
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();
if (script) {
	_.filename = script.src;
	if (!_.manual && !script.hasAttribute('data-manual')) {
		if(document.readyState !== "loading") {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(_.highlightAll);
			} else {
				window.setTimeout(_.highlightAll, 16);
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
}
return _self.Prism;
})();
if (module.exports) {
	module.exports = Prism;
}
if (typeof commonjsGlobal !== 'undefined') {
	commonjsGlobal.Prism = Prism;
}
Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': /<!DOCTYPE[\s\S]+?>/i,
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,
				inside: {
					'punctuation': [
						/^=/,
						{
							pattern: /(^|[^\\])["']/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}
		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};
Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];
Prism.hooks.add('wrap', function(env) {
	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});
Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;
Prism.languages.css = {
	'comment': /\/\*[\s\S]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(?:;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
		}
	},
	'url': /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^{}\s][^{};]*?(?=\s*\{)/,
	'string': {
		pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};
Prism.languages.css['atrule'].inside.rest = Prism.languages.css;
if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism.languages.css,
			alias: 'language-css',
			greedy: true
		}
	});
	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
}
Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(?:true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};
Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
	'function': /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,
	'operator': /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
});
Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true,
		greedy: true
	},
	'function-variable': {
		pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,
		alias: 'function'
	},
	'constant': /\b[A-Z][A-Z\d_]*\b/
});
Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\[\s\S]|[^\\`])*`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\$\{[^}]+\}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});
if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
			alias: 'language-javascript',
			greedy: true
		}
	});
}
Prism.languages.js = Prism.languages.javascript;
(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}
	self.Prism.fileHighlight = function() {
		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};
		Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function (pre) {
			var src = pre.getAttribute('data-src');
			var language, parent = pre;
			var lang = /\blang(?:uage)?-(?!\*)([\w-]+)\b/i;
			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}
			if (parent) {
				language = (pre.className.match(lang) || [, ''])[1];
			}
			if (!language) {
				var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
				language = Extensions[extension] || extension;
			}
			var code = document.createElement('code');
			code.className = 'language-' + language;
			pre.textContent = '';
			code.textContent = 'Loading…';
			pre.appendChild(code);
			var xhr = new XMLHttpRequest();
			xhr.open('GET', src, true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					if (xhr.status < 400 && xhr.responseText) {
						code.textContent = xhr.responseText;
						Prism.highlightElement(code);
					}
					else if (xhr.status >= 400) {
						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
					}
					else {
						code.textContent = '✖ Error: File does not exist or is empty';
					}
				}
			};
			if (pre.hasAttribute('data-download-link') && Prism.plugins.toolbar) {
				Prism.plugins.toolbar.registerButton('download-file', function () {
					var a = document.createElement('a');
					a.textContent = pre.getAttribute('data-download-link-label') || 'Download';
					a.setAttribute('download', '');
					a.href = src;
					return a;
				});
			}
			xhr.send(null);
		});
	};
	document.addEventListener('DOMContentLoaded', self.Prism.fileHighlight);
})();
});

global.Prism = prism;

var commonmark_min = createCommonjsModule(function (module, exports) {
!function(f){module.exports=f();}(function(){return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof commonjsRequire&&commonjsRequire;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n||e)},l,l.exports,e,t,n,r);}return n[o].exports}for(var i="function"==typeof commonjsRequire&&commonjsRequire,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){var Node=require("./node"),unescapeString=require("./common").unescapeString,OPENTAG=require("./common").OPENTAG,CLOSETAG=require("./common").CLOSETAG,InlineParser=require("./inlines"),reHtmlBlockOpen=[/./,/^<(?:script|pre|style)(?:\s|>|$)/i,/^<!--/,/^<[?]/,/^<![A-Z]/,/^<!\[CDATA\[/,/^<[/]?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[123456]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|title|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|[/]?[>]|$)/i,new RegExp("^(?:"+OPENTAG+"|"+CLOSETAG+")\\s*$","i")],reHtmlBlockClose=[/./,/<\/(?:script|pre|style)>/i,/-->/,/\?>/,/>/,/\]\]>/],reThematicBreak=/^(?:(?:\*[ \t]*){3,}|(?:_[ \t]*){3,}|(?:-[ \t]*){3,})[ \t]*$/,reMaybeSpecial=/^[#`~*+_=<>0-9-]/,reNonSpace=/[^ \t\f\v\r\n]/,reBulletListMarker=/^[*+-]/,reOrderedListMarker=/^(\d{1,9})([.)])/,reATXHeadingMarker=/^#{1,6}(?:[ \t]+|$)/,reCodeFence=/^`{3,}(?!.*`)|^~{3,}(?!.*~)/,reClosingCodeFence=/^(?:`{3,}|~{3,})(?= *$)/,reSetextHeadingLine=/^(?:=+|-+)[ \t]*$/,reLineEnding=/\r\n|\n|\r/,isBlank=function(s){return !reNonSpace.test(s)},isSpaceOrTab=function(c){return 32===c||9===c},peek=function(ln,pos){return pos<ln.length?ln.charCodeAt(pos):-1},endsWithBlankLine=function(block){for(;block;){if(block._lastLineBlank)return !0;var t=block.type;if("list"!==t&&"item"!==t)break;block=block._lastChild;}return !1},addLine=function(){if(this.partiallyConsumedTab){this.offset+=1;var charsToTab=4-this.column%4;this.tip._string_content+=" ".repeat(charsToTab);}this.tip._string_content+=this.currentLine.slice(this.offset)+"\n";},addChild=function(tag,offset){for(;!this.blocks[this.tip.type].canContain(tag);)this.finalize(this.tip,this.lineNumber-1);var column_number=offset+1,newBlock=new Node(tag,[[this.lineNumber,column_number],[0,0]]);return newBlock._string_content="",this.tip.appendChild(newBlock),this.tip=newBlock,newBlock},parseListMarker=function(parser,container){var match,nextc,spacesStartCol,spacesStartOffset,rest=parser.currentLine.slice(parser.nextNonspace),data={type:null,tight:!0,bulletChar:null,start:null,delimiter:null,padding:null,markerOffset:parser.indent};if(match=rest.match(reBulletListMarker))data.type="bullet",data.bulletChar=match[0][0];else{if(!(match=rest.match(reOrderedListMarker))||"paragraph"===container.type&&"1"!==match[1])return null;data.type="ordered",data.start=parseInt(match[1]),data.delimiter=match[2];}if(-1!==(nextc=peek(parser.currentLine,parser.nextNonspace+match[0].length))&&9!==nextc&&32!==nextc)return null;if("paragraph"===container.type&&!parser.currentLine.slice(parser.nextNonspace+match[0].length).match(reNonSpace))return null;parser.advanceNextNonspace(),parser.advanceOffset(match[0].length,!0),spacesStartCol=parser.column,spacesStartOffset=parser.offset;do{parser.advanceOffset(1,!0),nextc=peek(parser.currentLine,parser.offset);}while(parser.column-spacesStartCol<5&&isSpaceOrTab(nextc));var blank_item=-1===peek(parser.currentLine,parser.offset),spaces_after_marker=parser.column-spacesStartCol;return spaces_after_marker>=5||spaces_after_marker<1||blank_item?(data.padding=match[0].length+1,parser.column=spacesStartCol,parser.offset=spacesStartOffset,isSpaceOrTab(peek(parser.currentLine,parser.offset))&&parser.advanceOffset(1,!0)):data.padding=match[0].length+spaces_after_marker,data},listsMatch=function(list_data,item_data){return list_data.type===item_data.type&&list_data.delimiter===item_data.delimiter&&list_data.bulletChar===item_data.bulletChar},closeUnmatchedBlocks=function(){if(!this.allClosed){for(;this.oldtip!==this.lastMatchedContainer;){var parent=this.oldtip._parent;this.finalize(this.oldtip,this.lineNumber-1),this.oldtip=parent;}this.allClosed=!0;}},blocks={document:{continue:function(){return 0},finalize:function(){},canContain:function(t){return "item"!==t},acceptsLines:!1},list:{continue:function(){return 0},finalize:function(parser,block){for(var item=block._firstChild;item;){if(endsWithBlankLine(item)&&item._next){block._listData.tight=!1;break}for(var subitem=item._firstChild;subitem;){if(endsWithBlankLine(subitem)&&(item._next||subitem._next)){block._listData.tight=!1;break}subitem=subitem._next;}item=item._next;}},canContain:function(t){return "item"===t},acceptsLines:!1},block_quote:{continue:function(parser){var ln=parser.currentLine;return parser.indented||62!==peek(ln,parser.nextNonspace)?1:(parser.advanceNextNonspace(),parser.advanceOffset(1,!1),isSpaceOrTab(peek(ln,parser.offset))&&parser.advanceOffset(1,!0),0)},finalize:function(){},canContain:function(t){return "item"!==t},acceptsLines:!1},item:{continue:function(parser,container){if(parser.blank){if(null==container._firstChild)return 1;parser.advanceNextNonspace();}else{if(!(parser.indent>=container._listData.markerOffset+container._listData.padding))return 1;parser.advanceOffset(container._listData.markerOffset+container._listData.padding,!0);}return 0},finalize:function(){},canContain:function(t){return "item"!==t},acceptsLines:!1},heading:{continue:function(){return 1},finalize:function(){},canContain:function(){return !1},acceptsLines:!1},thematic_break:{continue:function(){return 1},finalize:function(){},canContain:function(){return !1},acceptsLines:!1},code_block:{continue:function(parser,container){var ln=parser.currentLine,indent=parser.indent;if(container._isFenced){var match=indent<=3&&ln.charAt(parser.nextNonspace)===container._fenceChar&&ln.slice(parser.nextNonspace).match(reClosingCodeFence);if(match&&match[0].length>=container._fenceLength)return parser.finalize(container,parser.lineNumber),2;for(var i=container._fenceOffset;i>0&&isSpaceOrTab(peek(ln,parser.offset));)parser.advanceOffset(1,!0),i--;}else if(indent>=4)parser.advanceOffset(4,!0);else{if(!parser.blank)return 1;parser.advanceNextNonspace();}return 0},finalize:function(parser,block){if(block._isFenced){var content=block._string_content,newlinePos=content.indexOf("\n"),firstLine=content.slice(0,newlinePos),rest=content.slice(newlinePos+1);block.info=unescapeString(firstLine.trim()),block._literal=rest;}else block._literal=block._string_content.replace(/(\n *)+$/,"\n");block._string_content=null;},canContain:function(){return !1},acceptsLines:!0},html_block:{continue:function(parser,container){return !parser.blank||6!==container._htmlBlockType&&7!==container._htmlBlockType?0:1},finalize:function(parser,block){block._literal=block._string_content.replace(/(\n *)+$/,""),block._string_content=null;},canContain:function(){return !1},acceptsLines:!0},paragraph:{continue:function(parser){return parser.blank?1:0},finalize:function(parser,block){for(var pos,hasReferenceDefs=!1;91===peek(block._string_content,0)&&(pos=parser.inlineParser.parseReference(block._string_content,parser.refmap));)block._string_content=block._string_content.slice(pos),hasReferenceDefs=!0;hasReferenceDefs&&isBlank(block._string_content)&&block.unlink();},canContain:function(){return !1},acceptsLines:!0}},blockStarts=[function(parser){return parser.indented||62!==peek(parser.currentLine,parser.nextNonspace)?0:(parser.advanceNextNonspace(),parser.advanceOffset(1,!1),isSpaceOrTab(peek(parser.currentLine,parser.offset))&&parser.advanceOffset(1,!0),parser.closeUnmatchedBlocks(),parser.addChild("block_quote",parser.nextNonspace),1)},function(parser){var match;if(!parser.indented&&(match=parser.currentLine.slice(parser.nextNonspace).match(reATXHeadingMarker))){parser.advanceNextNonspace(),parser.advanceOffset(match[0].length,!1),parser.closeUnmatchedBlocks();var container=parser.addChild("heading",parser.nextNonspace);return container.level=match[0].trim().length,container._string_content=parser.currentLine.slice(parser.offset).replace(/^[ \t]*#+[ \t]*$/,"").replace(/[ \t]+#+[ \t]*$/,""),parser.advanceOffset(parser.currentLine.length-parser.offset),2}return 0},function(parser){var match;if(!parser.indented&&(match=parser.currentLine.slice(parser.nextNonspace).match(reCodeFence))){var fenceLength=match[0].length;parser.closeUnmatchedBlocks();var container=parser.addChild("code_block",parser.nextNonspace);return container._isFenced=!0,container._fenceLength=fenceLength,container._fenceChar=match[0][0],container._fenceOffset=parser.indent,parser.advanceNextNonspace(),parser.advanceOffset(fenceLength,!1),2}return 0},function(parser,container){if(!parser.indented&&60===peek(parser.currentLine,parser.nextNonspace)){var blockType,s=parser.currentLine.slice(parser.nextNonspace);for(blockType=1;blockType<=7;blockType++)if(reHtmlBlockOpen[blockType].test(s)&&(blockType<7||"paragraph"!==container.type))return parser.closeUnmatchedBlocks(),parser.addChild("html_block",parser.offset)._htmlBlockType=blockType,2}return 0},function(parser,container){var match;if(!parser.indented&&"paragraph"===container.type&&(match=parser.currentLine.slice(parser.nextNonspace).match(reSetextHeadingLine))){parser.closeUnmatchedBlocks();var heading=new Node("heading",container.sourcepos);return heading.level="="===match[0][0]?1:2,heading._string_content=container._string_content,container.insertAfter(heading),container.unlink(),parser.tip=heading,parser.advanceOffset(parser.currentLine.length-parser.offset,!1),2}return 0},function(parser){return !parser.indented&&reThematicBreak.test(parser.currentLine.slice(parser.nextNonspace))?(parser.closeUnmatchedBlocks(),parser.addChild("thematic_break",parser.nextNonspace),parser.advanceOffset(parser.currentLine.length-parser.offset,!1),2):0},function(parser,container){var data;return parser.indented&&"list"!==container.type||!(data=parseListMarker(parser,container))?0:(parser.closeUnmatchedBlocks(),"list"===parser.tip.type&&listsMatch(container._listData,data)||((container=parser.addChild("list",parser.nextNonspace))._listData=data),container=parser.addChild("item",parser.nextNonspace),container._listData=data,1)},function(parser){return parser.indented&&"paragraph"!==parser.tip.type&&!parser.blank?(parser.advanceOffset(4,!0),parser.closeUnmatchedBlocks(),parser.addChild("code_block",parser.offset),2):0}],advanceOffset=function(count,columns){for(var charsToTab,charsToAdvance,c,currentLine=this.currentLine;count>0&&(c=currentLine[this.offset]);)"\t"===c?(charsToTab=4-this.column%4,columns?(this.partiallyConsumedTab=charsToTab>count,charsToAdvance=charsToTab>count?count:charsToTab,this.column+=charsToAdvance,this.offset+=this.partiallyConsumedTab?0:1,count-=charsToAdvance):(this.partiallyConsumedTab=!1,this.column+=charsToTab,this.offset+=1,count-=1)):(this.partiallyConsumedTab=!1,this.offset+=1,this.column+=1,count-=1);},advanceNextNonspace=function(){this.offset=this.nextNonspace,this.column=this.nextNonspaceColumn,this.partiallyConsumedTab=!1;},findNextNonspace=function(){for(var c,currentLine=this.currentLine,i=this.offset,cols=this.column;""!==(c=currentLine.charAt(i));)if(" "===c)i++,cols++;else{if("\t"!==c)break;i++,cols+=4-cols%4;}this.blank="\n"===c||"\r"===c||""===c,this.nextNonspace=i,this.nextNonspaceColumn=cols,this.indent=this.nextNonspaceColumn-this.column,this.indented=this.indent>=4;},incorporateLine=function(ln){var t,all_matched=!0,container=this.doc;this.oldtip=this.tip,this.offset=0,this.column=0,this.blank=!1,this.partiallyConsumedTab=!1,this.lineNumber+=1,-1!==ln.indexOf("\0")&&(ln=ln.replace(/\0/g,"�")),this.currentLine=ln;for(var lastChild;(lastChild=container._lastChild)&&lastChild._open;){switch(container=lastChild,this.findNextNonspace(),this.blocks[container.type].continue(this,container)){case 0:break;case 1:all_matched=!1;break;case 2:return void(this.lastLineLength=ln.length);default:throw"continue returned illegal value, must be 0, 1, or 2"}if(!all_matched){container=container._parent;break}}this.allClosed=container===this.oldtip,this.lastMatchedContainer=container;for(var matchedLeaf="paragraph"!==container.type&&blocks[container.type].acceptsLines,starts=this.blockStarts,startsLen=starts.length;!matchedLeaf;){if(this.findNextNonspace(),!this.indented&&!reMaybeSpecial.test(ln.slice(this.nextNonspace))){this.advanceNextNonspace();break}for(var i=0;i<startsLen;){var res=starts[i](this,container);if(1===res){container=this.tip;break}if(2===res){container=this.tip,matchedLeaf=!0;break}i++;}if(i===startsLen){this.advanceNextNonspace();break}}if(this.allClosed||this.blank||"paragraph"!==this.tip.type){this.closeUnmatchedBlocks(),this.blank&&container.lastChild&&(container.lastChild._lastLineBlank=!0),t=container.type;for(var lastLineBlank=this.blank&&!("block_quote"===t||"code_block"===t&&container._isFenced||"item"===t&&!container._firstChild&&container.sourcepos[0][0]===this.lineNumber),cont=container;cont;)cont._lastLineBlank=lastLineBlank,cont=cont._parent;this.blocks[t].acceptsLines?(this.addLine(),"html_block"===t&&container._htmlBlockType>=1&&container._htmlBlockType<=5&&reHtmlBlockClose[container._htmlBlockType].test(this.currentLine.slice(this.offset))&&this.finalize(container,this.lineNumber)):this.offset<ln.length&&!this.blank&&(container=this.addChild("paragraph",this.offset),this.advanceNextNonspace(),this.addLine());}else this.addLine();this.lastLineLength=ln.length;},finalize=function(block,lineNumber){var above=block._parent;block._open=!1,block.sourcepos[1]=[lineNumber,this.lastLineLength],this.blocks[block.type].finalize(this,block),this.tip=above;},processInlines=function(block){var node,event,t,walker=block.walker();for(this.inlineParser.refmap=this.refmap,this.inlineParser.options=this.options;event=walker.next();)t=(node=event.node).type,event.entering||"paragraph"!==t&&"heading"!==t||this.inlineParser.parse(node);},Document=function(){return new Node("document",[[1,1],[0,0]])},parse=function(input){this.doc=new Document,this.tip=this.doc,this.refmap={},this.lineNumber=0,this.lastLineLength=0,this.offset=0,this.column=0,this.lastMatchedContainer=this.doc,this.currentLine="",this.options.time&&console.time("preparing input");var lines=input.split(reLineEnding),len=lines.length;10===input.charCodeAt(input.length-1)&&(len-=1),this.options.time&&console.timeEnd("preparing input"),this.options.time&&console.time("block parsing");for(var i=0;i<len;i++)this.incorporateLine(lines[i]);for(;this.tip;)this.finalize(this.tip,len);return this.options.time&&console.timeEnd("block parsing"),this.options.time&&console.time("inline parsing"),this.processInlines(this.doc),this.options.time&&console.timeEnd("inline parsing"),this.doc};module.exports=function(options){return {doc:new Document,blocks:blocks,blockStarts:blockStarts,tip:this.doc,oldtip:this.doc,currentLine:"",lineNumber:0,offset:0,column:0,nextNonspace:0,nextNonspaceColumn:0,indent:0,indented:!1,blank:!1,partiallyConsumedTab:!1,allClosed:!0,lastMatchedContainer:this.doc,refmap:{},lastLineLength:0,inlineParser:new InlineParser(options),findNextNonspace:findNextNonspace,advanceOffset:advanceOffset,advanceNextNonspace:advanceNextNonspace,addLine:addLine,addChild:addChild,incorporateLine:incorporateLine,finalize:finalize,processInlines:processInlines,closeUnmatchedBlocks:closeUnmatchedBlocks,parse:parse,options:options||{}}};},{"./common":2,"./inlines":5,"./node":6}],2:[function(require,module,exports){var encode=require("mdurl/encode"),decode=require("mdurl/decode"),decodeHTML=require("entities").decodeHTML,ENTITY="&(?:#x[a-f0-9]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});",OPENTAG="<[A-Za-z][A-Za-z0-9-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^\"'=<>`\\x00-\\x20]+|'[^']*'|\"[^\"]*\"))?)*\\s*/?>",CLOSETAG="</[A-Za-z][A-Za-z0-9-]*\\s*[>]",reHtmlTag=new RegExp("^(?:<[A-Za-z][A-Za-z0-9-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^\"'=<>`\\x00-\\x20]+|'[^']*'|\"[^\"]*\"))?)*\\s*/?>|</[A-Za-z][A-Za-z0-9-]*\\s*[>]|\x3c!----\x3e|\x3c!--(?:-?[^>-])(?:-?[^-])*--\x3e|[<][?].*?[?][>]|<![A-Z]+\\s+[^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)","i"),reBackslashOrAmp=/[\\&]/,ESCAPABLE="[!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]",reEntityOrEscapedChar=new RegExp("\\\\"+ESCAPABLE+"|"+ENTITY,"gi"),reXmlSpecial=new RegExp('[&<>"]',"g"),reXmlSpecialOrEntity=new RegExp(ENTITY+'|[&<>"]',"gi"),unescapeChar=function(s){return 92===s.charCodeAt(0)?s.charAt(1):decodeHTML(s)},replaceUnsafeChar=function(s){switch(s){case"&":return "&amp;";case"<":return "&lt;";case">":return "&gt;";case'"':return "&quot;";default:return s}};module.exports={unescapeString:function(s){return reBackslashOrAmp.test(s)?s.replace(reEntityOrEscapedChar,unescapeChar):s},normalizeURI:function(uri){try{return encode(decode(uri))}catch(err){return uri}},escapeXml:function(s,preserve_entities){return reXmlSpecial.test(s)?preserve_entities?s.replace(reXmlSpecialOrEntity,replaceUnsafeChar):s.replace(reXmlSpecial,replaceUnsafeChar):s},reHtmlTag:reHtmlTag,OPENTAG:OPENTAG,CLOSETAG:CLOSETAG,ENTITY:ENTITY,ESCAPABLE:ESCAPABLE};},{entities:11,"mdurl/decode":19,"mdurl/encode":20}],3:[function(require,module,exports){if(String.fromCodePoint)module.exports=function(_){try{return String.fromCodePoint(_)}catch(e){if(e instanceof RangeError)return String.fromCharCode(65533);throw e}};else{var stringFromCharCode=String.fromCharCode,floor=Math.floor;module.exports=function(){var highSurrogate,lowSurrogate,codeUnits=[],index=-1,length=arguments.length;if(!length)return "";for(var result="";++index<length;){var codePoint=Number(arguments[index]);if(!isFinite(codePoint)||codePoint<0||codePoint>1114111||floor(codePoint)!==codePoint)return String.fromCharCode(65533);codePoint<=65535?codeUnits.push(codePoint):(highSurrogate=55296+((codePoint-=65536)>>10),lowSurrogate=codePoint%1024+56320,codeUnits.push(highSurrogate,lowSurrogate)),(index+1===length||codeUnits.length>16384)&&(result+=stringFromCharCode.apply(null,codeUnits),codeUnits.length=0);}return result};}},{}],4:[function(require,module,exports){module.exports.Node=require("./node"),module.exports.Parser=require("./blocks"),module.exports.HtmlRenderer=require("./render/html"),module.exports.XmlRenderer=require("./render/xml");},{"./blocks":1,"./node":6,"./render/html":8,"./render/xml":10}],5:[function(require,module,exports){var Node=require("./node"),common=require("./common"),normalizeReference=require("./normalize-reference"),normalizeURI=common.normalizeURI,unescapeString=common.unescapeString,fromCodePoint=require("./from-code-point.js"),decodeHTML=require("entities").decodeHTML;require("string.prototype.repeat");var ESCAPABLE=common.ESCAPABLE,ESCAPED_CHAR="\\\\"+ESCAPABLE,ENTITY=common.ENTITY,reHtmlTag=common.reHtmlTag,rePunctuation=new RegExp(/[!"#$%&'()*+,\-./:;<=>?@\[\]^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/),reLinkTitle=new RegExp('^(?:"('+ESCAPED_CHAR+'|[^"\\x00])*"|\'('+ESCAPED_CHAR+"|[^'\\x00])*'|\\(("+ESCAPED_CHAR+"|[^)\\x00])*\\))"),reLinkDestinationBraces=new RegExp("^(?:[<](?:[^ <>\\t\\n\\\\\\x00]|"+ESCAPED_CHAR+"|\\\\)*[>])"),reEscapable=new RegExp("^"+ESCAPABLE),reEntityHere=new RegExp("^"+ENTITY,"i"),reTicks=/`+/,reTicksHere=/^`+/,reEllipses=/\.\.\./g,reDash=/--+/g,reEmailAutolink=/^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/,reAutolink=/^<[A-Za-z][A-Za-z0-9.+-]{1,31}:[^<>\x00-\x20]*>/i,reSpnl=/^ *(?:\n *)?/,reWhitespaceChar=/^[ \t\n\x0b\x0c\x0d]/,reWhitespace=/[ \t\n\x0b\x0c\x0d]+/g,reUnicodeWhitespaceChar=/^\s/,reFinalSpace=/ *$/,reInitialSpace=/^ */,reSpaceAtEndOfLine=/^ *(?:\n|$)/,reLinkLabel=new RegExp("^\\[(?:[^\\\\\\[\\]]|"+ESCAPED_CHAR+"|\\\\){0,1000}\\]"),reMain=/^[^\n`\[\]\\!<&*_'"]+/m,text=function(s){var node=new Node("text");return node._literal=s,node},match=function(re){var m=re.exec(this.subject.slice(this.pos));return null===m?null:(this.pos+=m.index+m[0].length,m[0])},peek=function(){return this.pos<this.subject.length?this.subject.charCodeAt(this.pos):-1},spnl=function(){return this.match(reSpnl),!0},parseBackticks=function(block){var ticks=this.match(reTicksHere);if(null===ticks)return !1;for(var matched,node,afterOpenTicks=this.pos;null!==(matched=this.match(reTicks));)if(matched===ticks)return node=new Node("code"),node._literal=this.subject.slice(afterOpenTicks,this.pos-ticks.length).trim().replace(reWhitespace," "),block.appendChild(node),!0;return this.pos=afterOpenTicks,block.appendChild(text(ticks)),!0},parseBackslash=function(block){var node,subj=this.subject;return this.pos+=1,10===this.peek()?(this.pos+=1,node=new Node("linebreak"),block.appendChild(node)):reEscapable.test(subj.charAt(this.pos))?(block.appendChild(text(subj.charAt(this.pos))),this.pos+=1):block.appendChild(text("\\")),!0},parseAutolink=function(block){var m,dest,node;return (m=this.match(reEmailAutolink))?(dest=m.slice(1,m.length-1),node=new Node("link"),node._destination=normalizeURI("mailto:"+dest),node._title="",node.appendChild(text(dest)),block.appendChild(node),!0):!!(m=this.match(reAutolink))&&(dest=m.slice(1,m.length-1),node=new Node("link"),node._destination=normalizeURI(dest),node._title="",node.appendChild(text(dest)),block.appendChild(node),!0)},parseHtmlTag=function(block){var m=this.match(reHtmlTag);if(null===m)return !1;var node=new Node("html_inline");return node._literal=m,block.appendChild(node),!0},scanDelims=function(cc){var char_before,char_after,cc_after,left_flanking,right_flanking,can_open,can_close,after_is_whitespace,after_is_punctuation,before_is_whitespace,before_is_punctuation,numdelims=0,startpos=this.pos;if(39===cc||34===cc)numdelims++,this.pos++;else for(;this.peek()===cc;)numdelims++,this.pos++;return 0===numdelims?null:(char_before=0===startpos?"\n":this.subject.charAt(startpos-1),cc_after=this.peek(),char_after=-1===cc_after?"\n":fromCodePoint(cc_after),after_is_whitespace=reUnicodeWhitespaceChar.test(char_after),after_is_punctuation=rePunctuation.test(char_after),before_is_whitespace=reUnicodeWhitespaceChar.test(char_before),before_is_punctuation=rePunctuation.test(char_before),left_flanking=!after_is_whitespace&&(!after_is_punctuation||before_is_whitespace||before_is_punctuation),right_flanking=!before_is_whitespace&&(!before_is_punctuation||after_is_whitespace||after_is_punctuation),95===cc?(can_open=left_flanking&&(!right_flanking||before_is_punctuation),can_close=right_flanking&&(!left_flanking||after_is_punctuation)):39===cc||34===cc?(can_open=left_flanking&&!right_flanking,can_close=right_flanking):(can_open=left_flanking,can_close=right_flanking),this.pos=startpos,{numdelims:numdelims,can_open:can_open,can_close:can_close})},handleDelim=function(cc,block){var res=this.scanDelims(cc);if(!res)return !1;var contents,numdelims=res.numdelims,startpos=this.pos;this.pos+=numdelims,contents=39===cc?"’":34===cc?"“":this.subject.slice(startpos,this.pos);var node=text(contents);return block.appendChild(node),null!==(this.delimiters={cc:cc,numdelims:numdelims,origdelims:numdelims,node:node,previous:this.delimiters,next:null,can_open:res.can_open,can_close:res.can_close}).previous&&(this.delimiters.previous.next=this.delimiters),!0},removeDelimiter=function(delim){null!==delim.previous&&(delim.previous.next=delim.next),null===delim.next?this.delimiters=delim.previous:delim.next.previous=delim.previous;},removeDelimitersBetween=function(bottom,top){bottom.next!==top&&(bottom.next=top,top.previous=bottom);},processEmphasis=function(stack_bottom){var opener,closer,old_closer,opener_inl,closer_inl,tempstack,use_delims,tmp,next,opener_found,openers_bottom=[],odd_match=!1;for(openers_bottom[95]=stack_bottom,openers_bottom[42]=stack_bottom,openers_bottom[39]=stack_bottom,openers_bottom[34]=stack_bottom,closer=this.delimiters;null!==closer&&closer.previous!==stack_bottom;)closer=closer.previous;for(;null!==closer;){var closercc=closer.cc;if(closer.can_close){for(opener=closer.previous,opener_found=!1;null!==opener&&opener!==stack_bottom&&opener!==openers_bottom[closercc];){if(odd_match=(closer.can_open||opener.can_close)&&(opener.origdelims+closer.origdelims)%3==0,opener.cc===closer.cc&&opener.can_open&&!odd_match){opener_found=!0;break}opener=opener.previous;}if(old_closer=closer,42===closercc||95===closercc)if(opener_found){use_delims=closer.numdelims>=2&&opener.numdelims>=2?2:1,opener_inl=opener.node,closer_inl=closer.node,opener.numdelims-=use_delims,closer.numdelims-=use_delims,opener_inl._literal=opener_inl._literal.slice(0,opener_inl._literal.length-use_delims),closer_inl._literal=closer_inl._literal.slice(0,closer_inl._literal.length-use_delims);var emph=new Node(1===use_delims?"emph":"strong");for(tmp=opener_inl._next;tmp&&tmp!==closer_inl;)next=tmp._next,tmp.unlink(),emph.appendChild(tmp),tmp=next;opener_inl.insertAfter(emph),removeDelimitersBetween(opener,closer),0===opener.numdelims&&(opener_inl.unlink(),this.removeDelimiter(opener)),0===closer.numdelims&&(closer_inl.unlink(),tempstack=closer.next,this.removeDelimiter(closer),closer=tempstack);}else closer=closer.next;else 39===closercc?(closer.node._literal="’",opener_found&&(opener.node._literal="‘"),closer=closer.next):34===closercc&&(closer.node._literal="”",opener_found&&(opener.node.literal="“"),closer=closer.next);opener_found||odd_match||(openers_bottom[closercc]=old_closer.previous,old_closer.can_open||this.removeDelimiter(old_closer));}else closer=closer.next;}for(;null!==this.delimiters&&this.delimiters!==stack_bottom;)this.removeDelimiter(this.delimiters);},parseLinkTitle=function(){var title=this.match(reLinkTitle);return null===title?null:unescapeString(title.substr(1,title.length-2))},parseLinkDestination=function(){var res=this.match(reLinkDestinationBraces);if(null===res){for(var c,savepos=this.pos,openparens=0;-1!==(c=this.peek());)if(92===c)this.pos+=1,-1!==this.peek()&&(this.pos+=1);else if(40===c)this.pos+=1,openparens+=1;else if(41===c){if(openparens<1)break;this.pos+=1,openparens-=1;}else{if(null!==reWhitespaceChar.exec(fromCodePoint(c)))break;this.pos+=1;}return res=this.subject.substr(savepos,this.pos-savepos),normalizeURI(unescapeString(res))}return normalizeURI(unescapeString(res.substr(1,res.length-2)))},parseLinkLabel=function(){var m=this.match(reLinkLabel);return null===m||m.length>1001||/[^\\]\\\]$/.exec(m)?0:m.length},parseOpenBracket=function(block){var startpos=this.pos;this.pos+=1;var node=text("[");return block.appendChild(node),this.addBracket(node,startpos,!1),!0},parseBang=function(block){var startpos=this.pos;if(this.pos+=1,91===this.peek()){this.pos+=1;var node=text("![");block.appendChild(node),this.addBracket(node,startpos+1,!0);}else block.appendChild(text("!"));return !0},parseCloseBracket=function(block){var startpos,is_image,dest,title,reflabel,opener,matched=!1;if(this.pos+=1,startpos=this.pos,null===(opener=this.brackets))return block.appendChild(text("]")),!0;if(!opener.active)return block.appendChild(text("]")),this.removeBracket(),!0;is_image=opener.image;var savepos=this.pos;if(40===this.peek()&&(this.pos++,this.spnl()&&null!==(dest=this.parseLinkDestination())&&this.spnl()&&(reWhitespaceChar.test(this.subject.charAt(this.pos-1))&&(title=this.parseLinkTitle()),!0)&&this.spnl()&&41===this.peek()?(this.pos+=1,matched=!0):this.pos=savepos),!matched){var beforelabel=this.pos,n=this.parseLinkLabel();if(n>2?reflabel=this.subject.slice(beforelabel,beforelabel+n):opener.bracketAfter||(reflabel=this.subject.slice(opener.index,startpos)),0===n&&(this.pos=savepos),reflabel){var link=this.refmap[normalizeReference(reflabel)];link&&(dest=link.destination,title=link.title,matched=!0);}}if(matched){var node=new Node(is_image?"image":"link");node._destination=dest,node._title=title||"";var tmp,next;for(tmp=opener.node._next;tmp;)next=tmp._next,tmp.unlink(),node.appendChild(tmp),tmp=next;if(block.appendChild(node),this.processEmphasis(opener.previousDelimiter),this.removeBracket(),opener.node.unlink(),!is_image)for(opener=this.brackets;null!==opener;)opener.image||(opener.active=!1),opener=opener.previous;return !0}return this.removeBracket(),this.pos=startpos,block.appendChild(text("]")),!0},addBracket=function(node,index,image){null!==this.brackets&&(this.brackets.bracketAfter=!0),this.brackets={node:node,previous:this.brackets,previousDelimiter:this.delimiters,index:index,image:image,active:!0};},removeBracket=function(){this.brackets=this.brackets.previous;},parseEntity=function(block){var m;return !!(m=this.match(reEntityHere))&&(block.appendChild(text(decodeHTML(m))),!0)},parseString=function(block){var m;return !!(m=this.match(reMain))&&(block.appendChild(this.options.smart?text(m.replace(reEllipses,"…").replace(reDash,function(chars){var enCount=0,emCount=0;return chars.length%3==0?emCount=chars.length/3:chars.length%2==0?enCount=chars.length/2:chars.length%3==2?(enCount=1,emCount=(chars.length-2)/3):(enCount=2,emCount=(chars.length-4)/3),"—".repeat(emCount)+"–".repeat(enCount)})):text(m)),!0)},parseNewline=function(block){this.pos+=1;var lastc=block._lastChild;if(lastc&&"text"===lastc.type&&" "===lastc._literal[lastc._literal.length-1]){var hardbreak=" "===lastc._literal[lastc._literal.length-2];lastc._literal=lastc._literal.replace(reFinalSpace,""),block.appendChild(new Node(hardbreak?"linebreak":"softbreak"));}else block.appendChild(new Node("softbreak"));return this.match(reInitialSpace),!0},parseReference=function(s,refmap){this.subject=s;var rawlabel,dest,title,matchChars,startpos=this.pos=0;if(0===(matchChars=this.parseLinkLabel()))return 0;if(rawlabel=this.subject.substr(0,matchChars),58!==this.peek())return this.pos=startpos,0;if(this.pos++,this.spnl(),null===(dest=this.parseLinkDestination())||0===dest.length)return this.pos=startpos,0;var beforetitle=this.pos;this.spnl(),null===(title=this.parseLinkTitle())&&(title="",this.pos=beforetitle);var atLineEnd=!0;if(null===this.match(reSpaceAtEndOfLine)&&(""===title?atLineEnd=!1:(title="",this.pos=beforetitle,atLineEnd=null!==this.match(reSpaceAtEndOfLine))),!atLineEnd)return this.pos=startpos,0;var normlabel=normalizeReference(rawlabel);return ""===normlabel?(this.pos=startpos,0):(refmap[normlabel]||(refmap[normlabel]={destination:dest,title:title}),this.pos-startpos)},parseInline=function(block){var res=!1,c=this.peek();if(-1===c)return !1;switch(c){case 10:res=this.parseNewline(block);break;case 92:res=this.parseBackslash(block);break;case 96:res=this.parseBackticks(block);break;case 42:case 95:res=this.handleDelim(c,block);break;case 39:case 34:res=this.options.smart&&this.handleDelim(c,block);break;case 91:res=this.parseOpenBracket(block);break;case 33:res=this.parseBang(block);break;case 93:res=this.parseCloseBracket(block);break;case 60:res=this.parseAutolink(block)||this.parseHtmlTag(block);break;case 38:res=this.parseEntity(block);break;default:res=this.parseString(block);}return res||(this.pos+=1,block.appendChild(text(fromCodePoint(c)))),!0},parseInlines=function(block){for(this.subject=block._string_content.trim(),this.pos=0,this.delimiters=null,this.brackets=null;this.parseInline(block););block._string_content=null,this.processEmphasis(null);};module.exports=function(options){return {subject:"",delimiters:null,brackets:null,pos:0,refmap:{},match:match,peek:peek,spnl:spnl,parseBackticks:parseBackticks,parseBackslash:parseBackslash,parseAutolink:parseAutolink,parseHtmlTag:parseHtmlTag,scanDelims:scanDelims,handleDelim:handleDelim,parseLinkTitle:parseLinkTitle,parseLinkDestination:parseLinkDestination,parseLinkLabel:parseLinkLabel,parseOpenBracket:parseOpenBracket,parseBang:parseBang,parseCloseBracket:parseCloseBracket,addBracket:addBracket,removeBracket:removeBracket,parseEntity:parseEntity,parseString:parseString,parseNewline:parseNewline,parseReference:parseReference,parseInline:parseInline,processEmphasis:processEmphasis,removeDelimiter:removeDelimiter,options:options||{},parse:parseInlines}};},{"./common":2,"./from-code-point.js":3,"./node":6,"./normalize-reference":7,entities:11,"string.prototype.repeat":21}],6:[function(require,module,exports){function isContainer(node){switch(node._type){case"document":case"block_quote":case"list":case"item":case"paragraph":case"heading":case"emph":case"strong":case"link":case"image":case"custom_inline":case"custom_block":return !0;default:return !1}}var resumeAt=function(node,entering){this.current=node,this.entering=!0===entering;},next=function(){var cur=this.current,entering=this.entering;if(null===cur)return null;var container=isContainer(cur);return entering&&container?cur._firstChild?(this.current=cur._firstChild,this.entering=!0):this.entering=!1:cur===this.root?this.current=null:null===cur._next?(this.current=cur._parent,this.entering=!1):(this.current=cur._next,this.entering=!0),{entering:entering,node:cur}},NodeWalker=function(root){return {current:root,root:root,entering:!0,next:next,resumeAt:resumeAt}},Node=function(nodeType,sourcepos){this._type=nodeType,this._parent=null,this._firstChild=null,this._lastChild=null,this._prev=null,this._next=null,this._sourcepos=sourcepos,this._lastLineBlank=!1,this._open=!0,this._string_content=null,this._literal=null,this._listData={},this._info=null,this._destination=null,this._title=null,this._isFenced=!1,this._fenceChar=null,this._fenceLength=0,this._fenceOffset=null,this._level=null,this._onEnter=null,this._onExit=null;},proto=Node.prototype;Object.defineProperty(proto,"isContainer",{get:function(){return isContainer(this)}}),Object.defineProperty(proto,"type",{get:function(){return this._type}}),Object.defineProperty(proto,"firstChild",{get:function(){return this._firstChild}}),Object.defineProperty(proto,"lastChild",{get:function(){return this._lastChild}}),Object.defineProperty(proto,"next",{get:function(){return this._next}}),Object.defineProperty(proto,"prev",{get:function(){return this._prev}}),Object.defineProperty(proto,"parent",{get:function(){return this._parent}}),Object.defineProperty(proto,"sourcepos",{get:function(){return this._sourcepos}}),Object.defineProperty(proto,"literal",{get:function(){return this._literal},set:function(s){this._literal=s;}}),Object.defineProperty(proto,"destination",{get:function(){return this._destination},set:function(s){this._destination=s;}}),Object.defineProperty(proto,"title",{get:function(){return this._title},set:function(s){this._title=s;}}),Object.defineProperty(proto,"info",{get:function(){return this._info},set:function(s){this._info=s;}}),Object.defineProperty(proto,"level",{get:function(){return this._level},set:function(s){this._level=s;}}),Object.defineProperty(proto,"listType",{get:function(){return this._listData.type},set:function(t){this._listData.type=t;}}),Object.defineProperty(proto,"listTight",{get:function(){return this._listData.tight},set:function(t){this._listData.tight=t;}}),Object.defineProperty(proto,"listStart",{get:function(){return this._listData.start},set:function(n){this._listData.start=n;}}),Object.defineProperty(proto,"listDelimiter",{get:function(){return this._listData.delimiter},set:function(delim){this._listData.delimiter=delim;}}),Object.defineProperty(proto,"onEnter",{get:function(){return this._onEnter},set:function(s){this._onEnter=s;}}),Object.defineProperty(proto,"onExit",{get:function(){return this._onExit},set:function(s){this._onExit=s;}}),Node.prototype.appendChild=function(child){child.unlink(),child._parent=this,this._lastChild?(this._lastChild._next=child,child._prev=this._lastChild,this._lastChild=child):(this._firstChild=child,this._lastChild=child);},Node.prototype.prependChild=function(child){child.unlink(),child._parent=this,this._firstChild?(this._firstChild._prev=child,child._next=this._firstChild,this._firstChild=child):(this._firstChild=child,this._lastChild=child);},Node.prototype.unlink=function(){this._prev?this._prev._next=this._next:this._parent&&(this._parent._firstChild=this._next),this._next?this._next._prev=this._prev:this._parent&&(this._parent._lastChild=this._prev),this._parent=null,this._next=null,this._prev=null;},Node.prototype.insertAfter=function(sibling){sibling.unlink(),sibling._next=this._next,sibling._next&&(sibling._next._prev=sibling),sibling._prev=this,this._next=sibling,sibling._parent=this._parent,sibling._next||(sibling._parent._lastChild=sibling);},Node.prototype.insertBefore=function(sibling){sibling.unlink(),sibling._prev=this._prev,sibling._prev&&(sibling._prev._next=sibling),sibling._next=this,this._prev=sibling,sibling._parent=this._parent,sibling._prev||(sibling._parent._firstChild=sibling);},Node.prototype.walker=function(){return new NodeWalker(this)},module.exports=Node;},{}],7:[function(require,module,exports){var regex=/[ \t\r\n]+|[A-Z\xB5\xC0-\xD6\xD8-\xDF\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u0149\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u017F\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C5\u01C7\u01C8\u01CA\u01CB\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F0-\u01F2\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0345\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03AB\u03B0\u03C2\u03CF-\u03D1\u03D5\u03D6\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F0\u03F1\u03F4\u03F5\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u0587\u10A0-\u10C5\u10C7\u10CD\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E96-\u1E9B\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F50\u1F52\u1F54\u1F56\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1F80-\u1FAF\u1FB2-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD2\u1FD3\u1FD6-\u1FDB\u1FE2-\u1FE4\u1FE6-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A\u212B\u2132\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0\uA7B1\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A]|\uD801[\uDC00-\uDC27]|\uD806[\uDCA0-\uDCBF]/g,map={A:"a",B:"b",C:"c",D:"d",E:"e",F:"f",G:"g",H:"h",I:"i",J:"j",K:"k",L:"l",M:"m",N:"n",O:"o",P:"p",Q:"q",R:"r",S:"s",T:"t",U:"u",V:"v",W:"w",X:"x",Y:"y",Z:"z","µ":"μ","À":"à","Á":"á","Â":"â","Ã":"ã","Ä":"ä","Å":"å","Æ":"æ","Ç":"ç","È":"è","É":"é","Ê":"ê","Ë":"ë","Ì":"ì","Í":"í","Î":"î","Ï":"ï","Ð":"ð","Ñ":"ñ","Ò":"ò","Ó":"ó","Ô":"ô","Õ":"õ","Ö":"ö","Ø":"ø","Ù":"ù","Ú":"ú","Û":"û","Ü":"ü","Ý":"ý","Þ":"þ","Ā":"ā","Ă":"ă","Ą":"ą","Ć":"ć","Ĉ":"ĉ","Ċ":"ċ","Č":"č","Ď":"ď","Đ":"đ","Ē":"ē","Ĕ":"ĕ","Ė":"ė","Ę":"ę","Ě":"ě","Ĝ":"ĝ","Ğ":"ğ","Ġ":"ġ","Ģ":"ģ","Ĥ":"ĥ","Ħ":"ħ","Ĩ":"ĩ","Ī":"ī","Ĭ":"ĭ","Į":"į","Ĳ":"ĳ","Ĵ":"ĵ","Ķ":"ķ","Ĺ":"ĺ","Ļ":"ļ","Ľ":"ľ","Ŀ":"ŀ","Ł":"ł","Ń":"ń","Ņ":"ņ","Ň":"ň","Ŋ":"ŋ","Ō":"ō","Ŏ":"ŏ","Ő":"ő","Œ":"œ","Ŕ":"ŕ","Ŗ":"ŗ","Ř":"ř","Ś":"ś","Ŝ":"ŝ","Ş":"ş","Š":"š","Ţ":"ţ","Ť":"ť","Ŧ":"ŧ","Ũ":"ũ","Ū":"ū","Ŭ":"ŭ","Ů":"ů","Ű":"ű","Ų":"ų","Ŵ":"ŵ","Ŷ":"ŷ","Ÿ":"ÿ","Ź":"ź","Ż":"ż","Ž":"ž","ſ":"s","Ɓ":"ɓ","Ƃ":"ƃ","Ƅ":"ƅ","Ɔ":"ɔ","Ƈ":"ƈ","Ɖ":"ɖ","Ɗ":"ɗ","Ƌ":"ƌ","Ǝ":"ǝ","Ə":"ə","Ɛ":"ɛ","Ƒ":"ƒ","Ɠ":"ɠ","Ɣ":"ɣ","Ɩ":"ɩ","Ɨ":"ɨ","Ƙ":"ƙ","Ɯ":"ɯ","Ɲ":"ɲ","Ɵ":"ɵ","Ơ":"ơ","Ƣ":"ƣ","Ƥ":"ƥ","Ʀ":"ʀ","Ƨ":"ƨ","Ʃ":"ʃ","Ƭ":"ƭ","Ʈ":"ʈ","Ư":"ư","Ʊ":"ʊ","Ʋ":"ʋ","Ƴ":"ƴ","Ƶ":"ƶ","Ʒ":"ʒ","Ƹ":"ƹ","Ƽ":"ƽ","Ǆ":"ǆ","ǅ":"ǆ","Ǉ":"ǉ","ǈ":"ǉ","Ǌ":"ǌ","ǋ":"ǌ","Ǎ":"ǎ","Ǐ":"ǐ","Ǒ":"ǒ","Ǔ":"ǔ","Ǖ":"ǖ","Ǘ":"ǘ","Ǚ":"ǚ","Ǜ":"ǜ","Ǟ":"ǟ","Ǡ":"ǡ","Ǣ":"ǣ","Ǥ":"ǥ","Ǧ":"ǧ","Ǩ":"ǩ","Ǫ":"ǫ","Ǭ":"ǭ","Ǯ":"ǯ","Ǳ":"ǳ","ǲ":"ǳ","Ǵ":"ǵ","Ƕ":"ƕ","Ƿ":"ƿ","Ǹ":"ǹ","Ǻ":"ǻ","Ǽ":"ǽ","Ǿ":"ǿ","Ȁ":"ȁ","Ȃ":"ȃ","Ȅ":"ȅ","Ȇ":"ȇ","Ȉ":"ȉ","Ȋ":"ȋ","Ȍ":"ȍ","Ȏ":"ȏ","Ȑ":"ȑ","Ȓ":"ȓ","Ȕ":"ȕ","Ȗ":"ȗ","Ș":"ș","Ț":"ț","Ȝ":"ȝ","Ȟ":"ȟ","Ƞ":"ƞ","Ȣ":"ȣ","Ȥ":"ȥ","Ȧ":"ȧ","Ȩ":"ȩ","Ȫ":"ȫ","Ȭ":"ȭ","Ȯ":"ȯ","Ȱ":"ȱ","Ȳ":"ȳ","Ⱥ":"ⱥ","Ȼ":"ȼ","Ƚ":"ƚ","Ⱦ":"ⱦ","Ɂ":"ɂ","Ƀ":"ƀ","Ʉ":"ʉ","Ʌ":"ʌ","Ɇ":"ɇ","Ɉ":"ɉ","Ɋ":"ɋ","Ɍ":"ɍ","Ɏ":"ɏ","ͅ":"ι","Ͱ":"ͱ","Ͳ":"ͳ","Ͷ":"ͷ","Ϳ":"ϳ","Ά":"ά","Έ":"έ","Ή":"ή","Ί":"ί","Ό":"ό","Ύ":"ύ","Ώ":"ώ","Α":"α","Β":"β","Γ":"γ","Δ":"δ","Ε":"ε","Ζ":"ζ","Η":"η","Θ":"θ","Ι":"ι","Κ":"κ","Λ":"λ","Μ":"μ","Ν":"ν","Ξ":"ξ","Ο":"ο","Π":"π","Ρ":"ρ","Σ":"σ","Τ":"τ","Υ":"υ","Φ":"φ","Χ":"χ","Ψ":"ψ","Ω":"ω","Ϊ":"ϊ","Ϋ":"ϋ","ς":"σ","Ϗ":"ϗ","ϐ":"β","ϑ":"θ","ϕ":"φ","ϖ":"π","Ϙ":"ϙ","Ϛ":"ϛ","Ϝ":"ϝ","Ϟ":"ϟ","Ϡ":"ϡ","Ϣ":"ϣ","Ϥ":"ϥ","Ϧ":"ϧ","Ϩ":"ϩ","Ϫ":"ϫ","Ϭ":"ϭ","Ϯ":"ϯ","ϰ":"κ","ϱ":"ρ","ϴ":"θ","ϵ":"ε","Ϸ":"ϸ","Ϲ":"ϲ","Ϻ":"ϻ","Ͻ":"ͻ","Ͼ":"ͼ","Ͽ":"ͽ","Ѐ":"ѐ","Ё":"ё","Ђ":"ђ","Ѓ":"ѓ","Є":"є","Ѕ":"ѕ","І":"і","Ї":"ї","Ј":"ј","Љ":"љ","Њ":"њ","Ћ":"ћ","Ќ":"ќ","Ѝ":"ѝ","Ў":"ў","Џ":"џ","А":"а","Б":"б","В":"в","Г":"г","Д":"д","Е":"е","Ж":"ж","З":"з","И":"и","Й":"й","К":"к","Л":"л","М":"м","Н":"н","О":"о","П":"п","Р":"р","С":"с","Т":"т","У":"у","Ф":"ф","Х":"х","Ц":"ц","Ч":"ч","Ш":"ш","Щ":"щ","Ъ":"ъ","Ы":"ы","Ь":"ь","Э":"э","Ю":"ю","Я":"я","Ѡ":"ѡ","Ѣ":"ѣ","Ѥ":"ѥ","Ѧ":"ѧ","Ѩ":"ѩ","Ѫ":"ѫ","Ѭ":"ѭ","Ѯ":"ѯ","Ѱ":"ѱ","Ѳ":"ѳ","Ѵ":"ѵ","Ѷ":"ѷ","Ѹ":"ѹ","Ѻ":"ѻ","Ѽ":"ѽ","Ѿ":"ѿ","Ҁ":"ҁ","Ҋ":"ҋ","Ҍ":"ҍ","Ҏ":"ҏ","Ґ":"ґ","Ғ":"ғ","Ҕ":"ҕ","Җ":"җ","Ҙ":"ҙ","Қ":"қ","Ҝ":"ҝ","Ҟ":"ҟ","Ҡ":"ҡ","Ң":"ң","Ҥ":"ҥ","Ҧ":"ҧ","Ҩ":"ҩ","Ҫ":"ҫ","Ҭ":"ҭ","Ү":"ү","Ұ":"ұ","Ҳ":"ҳ","Ҵ":"ҵ","Ҷ":"ҷ","Ҹ":"ҹ","Һ":"һ","Ҽ":"ҽ","Ҿ":"ҿ","Ӏ":"ӏ","Ӂ":"ӂ","Ӄ":"ӄ","Ӆ":"ӆ","Ӈ":"ӈ","Ӊ":"ӊ","Ӌ":"ӌ","Ӎ":"ӎ","Ӑ":"ӑ","Ӓ":"ӓ","Ӕ":"ӕ","Ӗ":"ӗ","Ә":"ә","Ӛ":"ӛ","Ӝ":"ӝ","Ӟ":"ӟ","Ӡ":"ӡ","Ӣ":"ӣ","Ӥ":"ӥ","Ӧ":"ӧ","Ө":"ө","Ӫ":"ӫ","Ӭ":"ӭ","Ӯ":"ӯ","Ӱ":"ӱ","Ӳ":"ӳ","Ӵ":"ӵ","Ӷ":"ӷ","Ӹ":"ӹ","Ӻ":"ӻ","Ӽ":"ӽ","Ӿ":"ӿ","Ԁ":"ԁ","Ԃ":"ԃ","Ԅ":"ԅ","Ԇ":"ԇ","Ԉ":"ԉ","Ԋ":"ԋ","Ԍ":"ԍ","Ԏ":"ԏ","Ԑ":"ԑ","Ԓ":"ԓ","Ԕ":"ԕ","Ԗ":"ԗ","Ԙ":"ԙ","Ԛ":"ԛ","Ԝ":"ԝ","Ԟ":"ԟ","Ԡ":"ԡ","Ԣ":"ԣ","Ԥ":"ԥ","Ԧ":"ԧ","Ԩ":"ԩ","Ԫ":"ԫ","Ԭ":"ԭ","Ԯ":"ԯ","Ա":"ա","Բ":"բ","Գ":"գ","Դ":"դ","Ե":"ե","Զ":"զ","Է":"է","Ը":"ը","Թ":"թ","Ժ":"ժ","Ի":"ի","Լ":"լ","Խ":"խ","Ծ":"ծ","Կ":"կ","Հ":"հ","Ձ":"ձ","Ղ":"ղ","Ճ":"ճ","Մ":"մ","Յ":"յ","Ն":"ն","Շ":"շ","Ո":"ո","Չ":"չ","Պ":"պ","Ջ":"ջ","Ռ":"ռ","Ս":"ս","Վ":"վ","Տ":"տ","Ր":"ր","Ց":"ց","Ւ":"ւ","Փ":"փ","Ք":"ք","Օ":"օ","Ֆ":"ֆ","Ⴀ":"ⴀ","Ⴁ":"ⴁ","Ⴂ":"ⴂ","Ⴃ":"ⴃ","Ⴄ":"ⴄ","Ⴅ":"ⴅ","Ⴆ":"ⴆ","Ⴇ":"ⴇ","Ⴈ":"ⴈ","Ⴉ":"ⴉ","Ⴊ":"ⴊ","Ⴋ":"ⴋ","Ⴌ":"ⴌ","Ⴍ":"ⴍ","Ⴎ":"ⴎ","Ⴏ":"ⴏ","Ⴐ":"ⴐ","Ⴑ":"ⴑ","Ⴒ":"ⴒ","Ⴓ":"ⴓ","Ⴔ":"ⴔ","Ⴕ":"ⴕ","Ⴖ":"ⴖ","Ⴗ":"ⴗ","Ⴘ":"ⴘ","Ⴙ":"ⴙ","Ⴚ":"ⴚ","Ⴛ":"ⴛ","Ⴜ":"ⴜ","Ⴝ":"ⴝ","Ⴞ":"ⴞ","Ⴟ":"ⴟ","Ⴠ":"ⴠ","Ⴡ":"ⴡ","Ⴢ":"ⴢ","Ⴣ":"ⴣ","Ⴤ":"ⴤ","Ⴥ":"ⴥ","Ⴧ":"ⴧ","Ⴭ":"ⴭ","Ḁ":"ḁ","Ḃ":"ḃ","Ḅ":"ḅ","Ḇ":"ḇ","Ḉ":"ḉ","Ḋ":"ḋ","Ḍ":"ḍ","Ḏ":"ḏ","Ḑ":"ḑ","Ḓ":"ḓ","Ḕ":"ḕ","Ḗ":"ḗ","Ḙ":"ḙ","Ḛ":"ḛ","Ḝ":"ḝ","Ḟ":"ḟ","Ḡ":"ḡ","Ḣ":"ḣ","Ḥ":"ḥ","Ḧ":"ḧ","Ḩ":"ḩ","Ḫ":"ḫ","Ḭ":"ḭ","Ḯ":"ḯ","Ḱ":"ḱ","Ḳ":"ḳ","Ḵ":"ḵ","Ḷ":"ḷ","Ḹ":"ḹ","Ḻ":"ḻ","Ḽ":"ḽ","Ḿ":"ḿ","Ṁ":"ṁ","Ṃ":"ṃ","Ṅ":"ṅ","Ṇ":"ṇ","Ṉ":"ṉ","Ṋ":"ṋ","Ṍ":"ṍ","Ṏ":"ṏ","Ṑ":"ṑ","Ṓ":"ṓ","Ṕ":"ṕ","Ṗ":"ṗ","Ṙ":"ṙ","Ṛ":"ṛ","Ṝ":"ṝ","Ṟ":"ṟ","Ṡ":"ṡ","Ṣ":"ṣ","Ṥ":"ṥ","Ṧ":"ṧ","Ṩ":"ṩ","Ṫ":"ṫ","Ṭ":"ṭ","Ṯ":"ṯ","Ṱ":"ṱ","Ṳ":"ṳ","Ṵ":"ṵ","Ṷ":"ṷ","Ṹ":"ṹ","Ṻ":"ṻ","Ṽ":"ṽ","Ṿ":"ṿ","Ẁ":"ẁ","Ẃ":"ẃ","Ẅ":"ẅ","Ẇ":"ẇ","Ẉ":"ẉ","Ẋ":"ẋ","Ẍ":"ẍ","Ẏ":"ẏ","Ẑ":"ẑ","Ẓ":"ẓ","Ẕ":"ẕ","ẛ":"ṡ","Ạ":"ạ","Ả":"ả","Ấ":"ấ","Ầ":"ầ","Ẩ":"ẩ","Ẫ":"ẫ","Ậ":"ậ","Ắ":"ắ","Ằ":"ằ","Ẳ":"ẳ","Ẵ":"ẵ","Ặ":"ặ","Ẹ":"ẹ","Ẻ":"ẻ","Ẽ":"ẽ","Ế":"ế","Ề":"ề","Ể":"ể","Ễ":"ễ","Ệ":"ệ","Ỉ":"ỉ","Ị":"ị","Ọ":"ọ","Ỏ":"ỏ","Ố":"ố","Ồ":"ồ","Ổ":"ổ","Ỗ":"ỗ","Ộ":"ộ","Ớ":"ớ","Ờ":"ờ","Ở":"ở","Ỡ":"ỡ","Ợ":"ợ","Ụ":"ụ","Ủ":"ủ","Ứ":"ứ","Ừ":"ừ","Ử":"ử","Ữ":"ữ","Ự":"ự","Ỳ":"ỳ","Ỵ":"ỵ","Ỷ":"ỷ","Ỹ":"ỹ","Ỻ":"ỻ","Ỽ":"ỽ","Ỿ":"ỿ","Ἀ":"ἀ","Ἁ":"ἁ","Ἂ":"ἂ","Ἃ":"ἃ","Ἄ":"ἄ","Ἅ":"ἅ","Ἆ":"ἆ","Ἇ":"ἇ","Ἐ":"ἐ","Ἑ":"ἑ","Ἒ":"ἒ","Ἓ":"ἓ","Ἔ":"ἔ","Ἕ":"ἕ","Ἠ":"ἠ","Ἡ":"ἡ","Ἢ":"ἢ","Ἣ":"ἣ","Ἤ":"ἤ","Ἥ":"ἥ","Ἦ":"ἦ","Ἧ":"ἧ","Ἰ":"ἰ","Ἱ":"ἱ","Ἲ":"ἲ","Ἳ":"ἳ","Ἴ":"ἴ","Ἵ":"ἵ","Ἶ":"ἶ","Ἷ":"ἷ","Ὀ":"ὀ","Ὁ":"ὁ","Ὂ":"ὂ","Ὃ":"ὃ","Ὄ":"ὄ","Ὅ":"ὅ","Ὑ":"ὑ","Ὓ":"ὓ","Ὕ":"ὕ","Ὗ":"ὗ","Ὠ":"ὠ","Ὡ":"ὡ","Ὢ":"ὢ","Ὣ":"ὣ","Ὤ":"ὤ","Ὥ":"ὥ","Ὦ":"ὦ","Ὧ":"ὧ","Ᾰ":"ᾰ","Ᾱ":"ᾱ","Ὰ":"ὰ","Ά":"ά","ι":"ι","Ὲ":"ὲ","Έ":"έ","Ὴ":"ὴ","Ή":"ή","Ῐ":"ῐ","Ῑ":"ῑ","Ὶ":"ὶ","Ί":"ί","Ῠ":"ῠ","Ῡ":"ῡ","Ὺ":"ὺ","Ύ":"ύ","Ῥ":"ῥ","Ὸ":"ὸ","Ό":"ό","Ὼ":"ὼ","Ώ":"ώ","Ω":"ω","K":"k","Å":"å","Ⅎ":"ⅎ","Ⅰ":"ⅰ","Ⅱ":"ⅱ","Ⅲ":"ⅲ","Ⅳ":"ⅳ","Ⅴ":"ⅴ","Ⅵ":"ⅵ","Ⅶ":"ⅶ","Ⅷ":"ⅷ","Ⅸ":"ⅸ","Ⅹ":"ⅹ","Ⅺ":"ⅺ","Ⅻ":"ⅻ","Ⅼ":"ⅼ","Ⅽ":"ⅽ","Ⅾ":"ⅾ","Ⅿ":"ⅿ","Ↄ":"ↄ","Ⓐ":"ⓐ","Ⓑ":"ⓑ","Ⓒ":"ⓒ","Ⓓ":"ⓓ","Ⓔ":"ⓔ","Ⓕ":"ⓕ","Ⓖ":"ⓖ","Ⓗ":"ⓗ","Ⓘ":"ⓘ","Ⓙ":"ⓙ","Ⓚ":"ⓚ","Ⓛ":"ⓛ","Ⓜ":"ⓜ","Ⓝ":"ⓝ","Ⓞ":"ⓞ","Ⓟ":"ⓟ","Ⓠ":"ⓠ","Ⓡ":"ⓡ","Ⓢ":"ⓢ","Ⓣ":"ⓣ","Ⓤ":"ⓤ","Ⓥ":"ⓥ","Ⓦ":"ⓦ","Ⓧ":"ⓧ","Ⓨ":"ⓨ","Ⓩ":"ⓩ","Ⰰ":"ⰰ","Ⰱ":"ⰱ","Ⰲ":"ⰲ","Ⰳ":"ⰳ","Ⰴ":"ⰴ","Ⰵ":"ⰵ","Ⰶ":"ⰶ","Ⰷ":"ⰷ","Ⰸ":"ⰸ","Ⰹ":"ⰹ","Ⰺ":"ⰺ","Ⰻ":"ⰻ","Ⰼ":"ⰼ","Ⰽ":"ⰽ","Ⰾ":"ⰾ","Ⰿ":"ⰿ","Ⱀ":"ⱀ","Ⱁ":"ⱁ","Ⱂ":"ⱂ","Ⱃ":"ⱃ","Ⱄ":"ⱄ","Ⱅ":"ⱅ","Ⱆ":"ⱆ","Ⱇ":"ⱇ","Ⱈ":"ⱈ","Ⱉ":"ⱉ","Ⱊ":"ⱊ","Ⱋ":"ⱋ","Ⱌ":"ⱌ","Ⱍ":"ⱍ","Ⱎ":"ⱎ","Ⱏ":"ⱏ","Ⱐ":"ⱐ","Ⱑ":"ⱑ","Ⱒ":"ⱒ","Ⱓ":"ⱓ","Ⱔ":"ⱔ","Ⱕ":"ⱕ","Ⱖ":"ⱖ","Ⱗ":"ⱗ","Ⱘ":"ⱘ","Ⱙ":"ⱙ","Ⱚ":"ⱚ","Ⱛ":"ⱛ","Ⱜ":"ⱜ","Ⱝ":"ⱝ","Ⱞ":"ⱞ","Ⱡ":"ⱡ","Ɫ":"ɫ","Ᵽ":"ᵽ","Ɽ":"ɽ","Ⱨ":"ⱨ","Ⱪ":"ⱪ","Ⱬ":"ⱬ","Ɑ":"ɑ","Ɱ":"ɱ","Ɐ":"ɐ","Ɒ":"ɒ","Ⱳ":"ⱳ","Ⱶ":"ⱶ","Ȿ":"ȿ","Ɀ":"ɀ","Ⲁ":"ⲁ","Ⲃ":"ⲃ","Ⲅ":"ⲅ","Ⲇ":"ⲇ","Ⲉ":"ⲉ","Ⲋ":"ⲋ","Ⲍ":"ⲍ","Ⲏ":"ⲏ","Ⲑ":"ⲑ","Ⲓ":"ⲓ","Ⲕ":"ⲕ","Ⲗ":"ⲗ","Ⲙ":"ⲙ","Ⲛ":"ⲛ","Ⲝ":"ⲝ","Ⲟ":"ⲟ","Ⲡ":"ⲡ","Ⲣ":"ⲣ","Ⲥ":"ⲥ","Ⲧ":"ⲧ","Ⲩ":"ⲩ","Ⲫ":"ⲫ","Ⲭ":"ⲭ","Ⲯ":"ⲯ","Ⲱ":"ⲱ","Ⲳ":"ⲳ","Ⲵ":"ⲵ","Ⲷ":"ⲷ","Ⲹ":"ⲹ","Ⲻ":"ⲻ","Ⲽ":"ⲽ","Ⲿ":"ⲿ","Ⳁ":"ⳁ","Ⳃ":"ⳃ","Ⳅ":"ⳅ","Ⳇ":"ⳇ","Ⳉ":"ⳉ","Ⳋ":"ⳋ","Ⳍ":"ⳍ","Ⳏ":"ⳏ","Ⳑ":"ⳑ","Ⳓ":"ⳓ","Ⳕ":"ⳕ","Ⳗ":"ⳗ","Ⳙ":"ⳙ","Ⳛ":"ⳛ","Ⳝ":"ⳝ","Ⳟ":"ⳟ","Ⳡ":"ⳡ","Ⳣ":"ⳣ","Ⳬ":"ⳬ","Ⳮ":"ⳮ","Ⳳ":"ⳳ","Ꙁ":"ꙁ","Ꙃ":"ꙃ","Ꙅ":"ꙅ","Ꙇ":"ꙇ","Ꙉ":"ꙉ","Ꙋ":"ꙋ","Ꙍ":"ꙍ","Ꙏ":"ꙏ","Ꙑ":"ꙑ","Ꙓ":"ꙓ","Ꙕ":"ꙕ","Ꙗ":"ꙗ","Ꙙ":"ꙙ","Ꙛ":"ꙛ","Ꙝ":"ꙝ","Ꙟ":"ꙟ","Ꙡ":"ꙡ","Ꙣ":"ꙣ","Ꙥ":"ꙥ","Ꙧ":"ꙧ","Ꙩ":"ꙩ","Ꙫ":"ꙫ","Ꙭ":"ꙭ","Ꚁ":"ꚁ","Ꚃ":"ꚃ","Ꚅ":"ꚅ","Ꚇ":"ꚇ","Ꚉ":"ꚉ","Ꚋ":"ꚋ","Ꚍ":"ꚍ","Ꚏ":"ꚏ","Ꚑ":"ꚑ","Ꚓ":"ꚓ","Ꚕ":"ꚕ","Ꚗ":"ꚗ","Ꚙ":"ꚙ","Ꚛ":"ꚛ","Ꜣ":"ꜣ","Ꜥ":"ꜥ","Ꜧ":"ꜧ","Ꜩ":"ꜩ","Ꜫ":"ꜫ","Ꜭ":"ꜭ","Ꜯ":"ꜯ","Ꜳ":"ꜳ","Ꜵ":"ꜵ","Ꜷ":"ꜷ","Ꜹ":"ꜹ","Ꜻ":"ꜻ","Ꜽ":"ꜽ","Ꜿ":"ꜿ","Ꝁ":"ꝁ","Ꝃ":"ꝃ","Ꝅ":"ꝅ","Ꝇ":"ꝇ","Ꝉ":"ꝉ","Ꝋ":"ꝋ","Ꝍ":"ꝍ","Ꝏ":"ꝏ","Ꝑ":"ꝑ","Ꝓ":"ꝓ","Ꝕ":"ꝕ","Ꝗ":"ꝗ","Ꝙ":"ꝙ","Ꝛ":"ꝛ","Ꝝ":"ꝝ","Ꝟ":"ꝟ","Ꝡ":"ꝡ","Ꝣ":"ꝣ","Ꝥ":"ꝥ","Ꝧ":"ꝧ","Ꝩ":"ꝩ","Ꝫ":"ꝫ","Ꝭ":"ꝭ","Ꝯ":"ꝯ","Ꝺ":"ꝺ","Ꝼ":"ꝼ","Ᵹ":"ᵹ","Ꝿ":"ꝿ","Ꞁ":"ꞁ","Ꞃ":"ꞃ","Ꞅ":"ꞅ","Ꞇ":"ꞇ","Ꞌ":"ꞌ","Ɥ":"ɥ","Ꞑ":"ꞑ","Ꞓ":"ꞓ","Ꞗ":"ꞗ","Ꞙ":"ꞙ","Ꞛ":"ꞛ","Ꞝ":"ꞝ","Ꞟ":"ꞟ","Ꞡ":"ꞡ","Ꞣ":"ꞣ","Ꞥ":"ꞥ","Ꞧ":"ꞧ","Ꞩ":"ꞩ","Ɦ":"ɦ","Ɜ":"ɜ","Ɡ":"ɡ","Ɬ":"ɬ","Ʞ":"ʞ","Ʇ":"ʇ","Ａ":"ａ","Ｂ":"ｂ","Ｃ":"ｃ","Ｄ":"ｄ","Ｅ":"ｅ","Ｆ":"ｆ","Ｇ":"ｇ","Ｈ":"ｈ","Ｉ":"ｉ","Ｊ":"ｊ","Ｋ":"ｋ","Ｌ":"ｌ","Ｍ":"ｍ","Ｎ":"ｎ","Ｏ":"ｏ","Ｐ":"ｐ","Ｑ":"ｑ","Ｒ":"ｒ","Ｓ":"ｓ","Ｔ":"ｔ","Ｕ":"ｕ","Ｖ":"ｖ","Ｗ":"ｗ","Ｘ":"ｘ","Ｙ":"ｙ","Ｚ":"ｚ","𐐀":"𐐨","𐐁":"𐐩","𐐂":"𐐪","𐐃":"𐐫","𐐄":"𐐬","𐐅":"𐐭","𐐆":"𐐮","𐐇":"𐐯","𐐈":"𐐰","𐐉":"𐐱","𐐊":"𐐲","𐐋":"𐐳","𐐌":"𐐴","𐐍":"𐐵","𐐎":"𐐶","𐐏":"𐐷","𐐐":"𐐸","𐐑":"𐐹","𐐒":"𐐺","𐐓":"𐐻","𐐔":"𐐼","𐐕":"𐐽","𐐖":"𐐾","𐐗":"𐐿","𐐘":"𐑀","𐐙":"𐑁","𐐚":"𐑂","𐐛":"𐑃","𐐜":"𐑄","𐐝":"𐑅","𐐞":"𐑆","𐐟":"𐑇","𐐠":"𐑈","𐐡":"𐑉","𐐢":"𐑊","𐐣":"𐑋","𐐤":"𐑌","𐐥":"𐑍","𐐦":"𐑎","𐐧":"𐑏","𑢠":"𑣀","𑢡":"𑣁","𑢢":"𑣂","𑢣":"𑣃","𑢤":"𑣄","𑢥":"𑣅","𑢦":"𑣆","𑢧":"𑣇","𑢨":"𑣈","𑢩":"𑣉","𑢪":"𑣊","𑢫":"𑣋","𑢬":"𑣌","𑢭":"𑣍","𑢮":"𑣎","𑢯":"𑣏","𑢰":"𑣐","𑢱":"𑣑","𑢲":"𑣒","𑢳":"𑣓","𑢴":"𑣔","𑢵":"𑣕","𑢶":"𑣖","𑢷":"𑣗","𑢸":"𑣘","𑢹":"𑣙","𑢺":"𑣚","𑢻":"𑣛","𑢼":"𑣜","𑢽":"𑣝","𑢾":"𑣞","𑢿":"𑣟","ß":"ss","İ":"i̇","ŉ":"ʼn","ǰ":"ǰ","ΐ":"ΐ","ΰ":"ΰ","և":"եւ","ẖ":"ẖ","ẗ":"ẗ","ẘ":"ẘ","ẙ":"ẙ","ẚ":"aʾ","ẞ":"ss","ὐ":"ὐ","ὒ":"ὒ","ὔ":"ὔ","ὖ":"ὖ","ᾀ":"ἀι","ᾁ":"ἁι","ᾂ":"ἂι","ᾃ":"ἃι","ᾄ":"ἄι","ᾅ":"ἅι","ᾆ":"ἆι","ᾇ":"ἇι","ᾈ":"ἀι","ᾉ":"ἁι","ᾊ":"ἂι","ᾋ":"ἃι","ᾌ":"ἄι","ᾍ":"ἅι","ᾎ":"ἆι","ᾏ":"ἇι","ᾐ":"ἠι","ᾑ":"ἡι","ᾒ":"ἢι","ᾓ":"ἣι","ᾔ":"ἤι","ᾕ":"ἥι","ᾖ":"ἦι","ᾗ":"ἧι","ᾘ":"ἠι","ᾙ":"ἡι","ᾚ":"ἢι","ᾛ":"ἣι","ᾜ":"ἤι","ᾝ":"ἥι","ᾞ":"ἦι","ᾟ":"ἧι","ᾠ":"ὠι","ᾡ":"ὡι","ᾢ":"ὢι","ᾣ":"ὣι","ᾤ":"ὤι","ᾥ":"ὥι","ᾦ":"ὦι","ᾧ":"ὧι","ᾨ":"ὠι","ᾩ":"ὡι","ᾪ":"ὢι","ᾫ":"ὣι","ᾬ":"ὤι","ᾭ":"ὥι","ᾮ":"ὦι","ᾯ":"ὧι","ᾲ":"ὰι","ᾳ":"αι","ᾴ":"άι","ᾶ":"ᾶ","ᾷ":"ᾶι","ᾼ":"αι","ῂ":"ὴι","ῃ":"ηι","ῄ":"ήι","ῆ":"ῆ","ῇ":"ῆι","ῌ":"ηι","ῒ":"ῒ","ΐ":"ΐ","ῖ":"ῖ","ῗ":"ῗ","ῢ":"ῢ","ΰ":"ΰ","ῤ":"ῤ","ῦ":"ῦ","ῧ":"ῧ","ῲ":"ὼι","ῳ":"ωι","ῴ":"ώι","ῶ":"ῶ","ῷ":"ῶι","ῼ":"ωι","ﬀ":"ff","ﬁ":"fi","ﬂ":"fl","ﬃ":"ffi","ﬄ":"ffl","ﬅ":"st","ﬆ":"st","ﬓ":"մն","ﬔ":"մե","ﬕ":"մի","ﬖ":"վն","ﬗ":"մխ"};module.exports=function(string){return string.slice(1,string.length-1).trim().replace(regex,function($0){return map[$0]||" "})};},{}],8:[function(require,module,exports){function HtmlRenderer(options){(options=options||{}).softbreak=options.softbreak||"\n",this.disableTags=0,this.lastOut="\n",this.options=options;}var Renderer=require("./renderer"),reUnsafeProtocol=/^javascript:|vbscript:|file:|data:/i,reSafeDataProtocol=/^data:image\/(?:png|gif|jpeg|webp)/i,potentiallyUnsafe=function(url){return reUnsafeProtocol.test(url)&&!reSafeDataProtocol.test(url)};(HtmlRenderer.prototype=Object.create(Renderer.prototype)).text=function(node){this.out(node.literal);},HtmlRenderer.prototype.html_inline=function(node){this.lit(this.options.safe?"\x3c!-- raw HTML omitted --\x3e":node.literal);},HtmlRenderer.prototype.html_block=function(node){this.cr(),this.lit(this.options.safe?"\x3c!-- raw HTML omitted --\x3e":node.literal),this.cr();},HtmlRenderer.prototype.softbreak=function(){this.lit(this.options.softbreak);},HtmlRenderer.prototype.linebreak=function(){this.tag("br",[],!0),this.cr();},HtmlRenderer.prototype.link=function(node,entering){var attrs=this.attrs(node);entering?(this.options.safe&&potentiallyUnsafe(node.destination)||attrs.push(["href",this.esc(node.destination,!0)]),node.title&&attrs.push(["title",this.esc(node.title,!0)]),this.tag("a",attrs)):this.tag("/a");},HtmlRenderer.prototype.image=function(node,entering){entering?(0===this.disableTags&&this.lit(this.options.safe&&potentiallyUnsafe(node.destination)?'<img src="" alt="':'<img src="'+this.esc(node.destination,!0)+'" alt="'),this.disableTags+=1):0==(this.disableTags-=1)&&(node.title&&this.lit('" title="'+this.esc(node.title,!0)),this.lit('" />'));},HtmlRenderer.prototype.emph=function(node,entering){this.tag(entering?"em":"/em");},HtmlRenderer.prototype.strong=function(node,entering){this.tag(entering?"strong":"/strong");},HtmlRenderer.prototype.paragraph=function(node,entering){var grandparent=node.parent.parent,attrs=this.attrs(node);null!==grandparent&&"list"===grandparent.type&&grandparent.listTight||(entering?(this.cr(),this.tag("p",attrs)):(this.tag("/p"),this.cr()));},HtmlRenderer.prototype.heading=function(node,entering){var tagname="h"+node.level,attrs=this.attrs(node);entering?(this.cr(),this.tag(tagname,attrs)):(this.tag("/"+tagname),this.cr());},HtmlRenderer.prototype.code=function(node){this.tag("code"),this.out(node.literal),this.tag("/code");},HtmlRenderer.prototype.code_block=function(node){var info_words=node.info?node.info.split(/\s+/):[],attrs=this.attrs(node);info_words.length>0&&info_words[0].length>0&&attrs.push(["class","language-"+this.esc(info_words[0],!0)]),this.cr(),this.tag("pre"),this.tag("code",attrs),this.out(node.literal),this.tag("/code"),this.tag("/pre"),this.cr();},HtmlRenderer.prototype.thematic_break=function(node){var attrs=this.attrs(node);this.cr(),this.tag("hr",attrs,!0),this.cr();},HtmlRenderer.prototype.block_quote=function(node,entering){var attrs=this.attrs(node);entering?(this.cr(),this.tag("blockquote",attrs),this.cr()):(this.cr(),this.tag("/blockquote"),this.cr());},HtmlRenderer.prototype.list=function(node,entering){var tagname="bullet"===node.listType?"ul":"ol",attrs=this.attrs(node);if(entering){var start=node.listStart;null!==start&&1!==start&&attrs.push(["start",start.toString()]),this.cr(),this.tag(tagname,attrs),this.cr();}else this.cr(),this.tag("/"+tagname),this.cr();},HtmlRenderer.prototype.item=function(node,entering){var attrs=this.attrs(node);entering?this.tag("li",attrs):(this.tag("/li"),this.cr());},HtmlRenderer.prototype.custom_inline=function(node,entering){entering&&node.onEnter?this.lit(node.onEnter):!entering&&node.onExit&&this.lit(node.onExit);},HtmlRenderer.prototype.custom_block=function(node,entering){this.cr(),entering&&node.onEnter?this.lit(node.onEnter):!entering&&node.onExit&&this.lit(node.onExit),this.cr();},HtmlRenderer.prototype.esc=require("../common").escapeXml,HtmlRenderer.prototype.out=function(s){this.lit(this.esc(s,!1));},HtmlRenderer.prototype.tag=function(name,attrs,selfclosing){if(!(this.disableTags>0)){if(this.buffer+="<"+name,attrs&&attrs.length>0)for(var attrib,i=0;void 0!==(attrib=attrs[i]);)this.buffer+=" "+attrib[0]+'="'+attrib[1]+'"',i++;selfclosing&&(this.buffer+=" /"),this.buffer+=">",this.lastOut=">";}},HtmlRenderer.prototype.attrs=function(node){var att=[];if(this.options.sourcepos){var pos=node.sourcepos;pos&&att.push(["data-sourcepos",String(pos[0][0])+":"+String(pos[0][1])+"-"+String(pos[1][0])+":"+String(pos[1][1])]);}return att},module.exports=HtmlRenderer;},{"../common":2,"./renderer":9}],9:[function(require,module,exports){function Renderer(){}Renderer.prototype.render=function(ast){var event,type,walker=ast.walker();for(this.buffer="",this.lastOut="\n";event=walker.next();)this[type=event.node.type]&&this[type](event.node,event.entering);return this.buffer},Renderer.prototype.out=function(str){this.lit(str);},Renderer.prototype.lit=function(str){this.buffer+=str,this.lastOut=str;},Renderer.prototype.cr=function(){"\n"!==this.lastOut&&this.lit("\n");},Renderer.prototype.esc=function(str){return str},module.exports=Renderer;},{}],10:[function(require,module,exports){function toTagName(s){return s.replace(/([a-z])([A-Z])/g,"$1_$2").toLowerCase()}function XmlRenderer(options){options=options||{},this.disableTags=0,this.lastOut="\n",this.indentLevel=0,this.indent="  ",this.options=options;}var Renderer=require("./renderer"),reXMLTag=/\<[^>]*\>/;(XmlRenderer.prototype=Object.create(Renderer.prototype)).render=function(ast){this.buffer="";var attrs,tagname,event,node,entering,container,selfClosing,nodetype,walker=ast.walker(),options=this.options;for(options.time&&console.time("rendering"),this.buffer+='<?xml version="1.0" encoding="UTF-8"?>\n',this.buffer+='<!DOCTYPE document SYSTEM "CommonMark.dtd">\n';event=walker.next();)if(entering=event.entering,node=event.node,nodetype=node.type,container=node.isContainer,selfClosing="thematic_break"===nodetype||"linebreak"===nodetype||"softbreak"===nodetype,tagname=toTagName(nodetype),entering){switch(attrs=[],nodetype){case"document":attrs.push(["xmlns","http://commonmark.org/xml/1.0"]);break;case"list":null!==node.listType&&attrs.push(["type",node.listType.toLowerCase()]),null!==node.listStart&&attrs.push(["start",String(node.listStart)]),null!==node.listTight&&attrs.push(["tight",node.listTight?"true":"false"]);var delim=node.listDelimiter;if(null!==delim){var delimword="";delimword="."===delim?"period":"paren",attrs.push(["delimiter",delimword]);}break;case"code_block":node.info&&attrs.push(["info",node.info]);break;case"heading":attrs.push(["level",String(node.level)]);break;case"link":case"image":attrs.push(["destination",node.destination]),attrs.push(["title",node.title]);break;case"custom_inline":case"custom_block":attrs.push(["on_enter",node.onEnter]),attrs.push(["on_exit",node.onExit]);}if(options.sourcepos){var pos=node.sourcepos;pos&&attrs.push(["sourcepos",String(pos[0][0])+":"+String(pos[0][1])+"-"+String(pos[1][0])+":"+String(pos[1][1])]);}if(this.cr(),this.out(this.tag(tagname,attrs,selfClosing)),container)this.indentLevel+=1;else if(!container&&!selfClosing){var lit=node.literal;lit&&this.out(this.esc(lit)),this.out(this.tag("/"+tagname));}}else this.indentLevel-=1,this.cr(),this.out(this.tag("/"+tagname));return options.time&&console.timeEnd("rendering"),this.buffer+="\n"},XmlRenderer.prototype.out=function(s){this.buffer+=this.disableTags>0?s.replace(reXMLTag,""):s,this.lastOut=s;},XmlRenderer.prototype.cr=function(){if("\n"!==this.lastOut){this.buffer+="\n",this.lastOut="\n";for(var i=this.indentLevel;i>0;i--)this.buffer+=this.indent;}},XmlRenderer.prototype.tag=function(name,attrs,selfclosing){var result="<"+name;if(attrs&&attrs.length>0)for(var attrib,i=0;void 0!==(attrib=attrs[i]);)result+=" "+attrib[0]+'="'+this.esc(attrib[1])+'"',i++;return selfclosing&&(result+=" /"),result+=">"},XmlRenderer.prototype.esc=require("../common").escapeXml,module.exports=XmlRenderer;},{"../common":2,"./renderer":9}],11:[function(require,module,exports){var encode=require("./lib/encode.js"),decode=require("./lib/decode.js");exports.decode=function(data,level){return (!level||level<=0?decode.XML:decode.HTML)(data)},exports.decodeStrict=function(data,level){return (!level||level<=0?decode.XML:decode.HTMLStrict)(data)},exports.encode=function(data,level){return (!level||level<=0?encode.XML:encode.HTML)(data)},exports.encodeXML=encode.XML,exports.encodeHTML4=exports.encodeHTML5=exports.encodeHTML=encode.HTML,exports.decodeXML=exports.decodeXMLStrict=decode.XML,exports.decodeHTML4=exports.decodeHTML5=exports.decodeHTML=decode.HTML,exports.decodeHTML4Strict=exports.decodeHTML5Strict=exports.decodeHTMLStrict=decode.HTMLStrict,exports.escape=encode.escape;},{"./lib/decode.js":12,"./lib/encode.js":14}],12:[function(require,module,exports){function getStrictDecoder(map){var keys=Object.keys(map).join("|"),replace=getReplacer(map);keys+="|#[xX][\\da-fA-F]+|#\\d+";var re=new RegExp("&(?:"+keys+");","g");return function(str){return String(str).replace(re,replace)}}function sorter(a,b){return a<b?1:-1}function getReplacer(map){return function(str){return "#"===str.charAt(1)?decodeCodePoint("X"===str.charAt(2)||"x"===str.charAt(2)?parseInt(str.substr(3),16):parseInt(str.substr(2),10)):map[str.slice(1,-1)]}}var entityMap=require("../maps/entities.json"),legacyMap=require("../maps/legacy.json"),xmlMap=require("../maps/xml.json"),decodeCodePoint=require("./decode_codepoint.js"),decodeXMLStrict=getStrictDecoder(xmlMap),decodeHTMLStrict=getStrictDecoder(entityMap),decodeHTML=function(){function replacer(str){return ";"!==str.substr(-1)&&(str+=";"),replace(str)}for(var legacy=Object.keys(legacyMap).sort(sorter),keys=Object.keys(entityMap).sort(sorter),i=0,j=0;i<keys.length;i++)legacy[j]===keys[i]?(keys[i]+=";?",j++):keys[i]+=";";var re=new RegExp("&(?:"+keys.join("|")+"|#[xX][\\da-fA-F]+;?|#\\d+;?)","g"),replace=getReplacer(entityMap);return function(str){return String(str).replace(re,replacer)}}();module.exports={XML:decodeXMLStrict,HTML:decodeHTML,HTMLStrict:decodeHTMLStrict};},{"../maps/entities.json":16,"../maps/legacy.json":17,"../maps/xml.json":18,"./decode_codepoint.js":13}],13:[function(require,module,exports){var decodeMap=require("../maps/decode.json");module.exports=function(codePoint){if(codePoint>=55296&&codePoint<=57343||codePoint>1114111)return "�";codePoint in decodeMap&&(codePoint=decodeMap[codePoint]);var output="";return codePoint>65535&&(codePoint-=65536,output+=String.fromCharCode(codePoint>>>10&1023|55296),codePoint=56320|1023&codePoint),output+=String.fromCharCode(codePoint)};},{"../maps/decode.json":15}],14:[function(require,module,exports){function getInverseObj(obj){return Object.keys(obj).sort().reduce(function(inverse,name){return inverse[obj[name]]="&"+name+";",inverse},{})}function getInverseReplacer(inverse){var single=[],multiple=[];return Object.keys(inverse).forEach(function(k){1===k.length?single.push("\\"+k):multiple.push(k);}),multiple.unshift("["+single.join("")+"]"),new RegExp(multiple.join("|"),"g")}function singleCharReplacer(c){return "&#x"+c.charCodeAt(0).toString(16).toUpperCase()+";"}function astralReplacer(c){return "&#x"+(1024*(c.charCodeAt(0)-55296)+c.charCodeAt(1)-56320+65536).toString(16).toUpperCase()+";"}function getInverse(inverse,re){function func(name){return inverse[name]}return function(data){return data.replace(re,func).replace(re_astralSymbols,astralReplacer).replace(re_nonASCII,singleCharReplacer)}}var inverseXML=getInverseObj(require("../maps/xml.json")),xmlReplacer=getInverseReplacer(inverseXML);exports.XML=getInverse(inverseXML,xmlReplacer);var inverseHTML=getInverseObj(require("../maps/entities.json")),htmlReplacer=getInverseReplacer(inverseHTML);exports.HTML=getInverse(inverseHTML,htmlReplacer);var re_nonASCII=/[^\0-\x7F]/g,re_astralSymbols=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,re_xmlChars=getInverseReplacer(inverseXML);exports.escape=function(data){return data.replace(re_xmlChars,singleCharReplacer).replace(re_astralSymbols,astralReplacer).replace(re_nonASCII,singleCharReplacer)};},{"../maps/entities.json":16,"../maps/xml.json":18}],15:[function(require,module,exports){module.exports={0:65533,128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};},{}],16:[function(require,module,exports){module.exports={Aacute:"Á",aacute:"á",Abreve:"Ă",abreve:"ă",ac:"∾",acd:"∿",acE:"∾̳",Acirc:"Â",acirc:"â",acute:"´",Acy:"А",acy:"а",AElig:"Æ",aelig:"æ",af:"⁡",Afr:"𝔄",afr:"𝔞",Agrave:"À",agrave:"à",alefsym:"ℵ",aleph:"ℵ",Alpha:"Α",alpha:"α",Amacr:"Ā",amacr:"ā",amalg:"⨿",amp:"&",AMP:"&",andand:"⩕",And:"⩓",and:"∧",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angmsd:"∡",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",Aogon:"Ą",aogon:"ą",Aopf:"𝔸",aopf:"𝕒",apacir:"⩯",ap:"≈",apE:"⩰",ape:"≊",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",Aring:"Å",aring:"å",Ascr:"𝒜",ascr:"𝒶",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",barwed:"⌅",Barwed:"⌆",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",Bcy:"Б",bcy:"б",bdquo:"„",becaus:"∵",because:"∵",Because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",Beta:"Β",beta:"β",beth:"ℶ",between:"≬",Bfr:"𝔅",bfr:"𝔟",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bNot:"⫭",bnot:"⌐",Bopf:"𝔹",bopf:"𝕓",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxdl:"┐",boxdL:"╕",boxDl:"╖",boxDL:"╗",boxdr:"┌",boxdR:"╒",boxDr:"╓",boxDR:"╔",boxh:"─",boxH:"═",boxhd:"┬",boxHd:"╤",boxhD:"╥",boxHD:"╦",boxhu:"┴",boxHu:"╧",boxhU:"╨",boxHU:"╩",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxul:"┘",boxuL:"╛",boxUl:"╜",boxUL:"╝",boxur:"└",boxuR:"╘",boxUr:"╙",boxUR:"╚",boxv:"│",boxV:"║",boxvh:"┼",boxvH:"╪",boxVh:"╫",boxVH:"╬",boxvl:"┤",boxvL:"╡",boxVl:"╢",boxVL:"╣",boxvr:"├",boxvR:"╞",boxVr:"╟",boxVR:"╠",bprime:"‵",breve:"˘",Breve:"˘",brvbar:"¦",bscr:"𝒷",Bscr:"ℬ",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsolb:"⧅",bsol:"\\",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpE:"⪮",bumpe:"≏",Bumpeq:"≎",bumpeq:"≏",Cacute:"Ć",cacute:"ć",capand:"⩄",capbrcup:"⩉",capcap:"⩋",cap:"∩",Cap:"⋒",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",Ccaron:"Č",ccaron:"č",Ccedil:"Ç",ccedil:"ç",Ccirc:"Ĉ",ccirc:"ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",Cdot:"Ċ",cdot:"ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",centerdot:"·",CenterDot:"·",cfr:"𝔠",Cfr:"ℭ",CHcy:"Ч",chcy:"ч",check:"✓",checkmark:"✓",Chi:"Χ",chi:"χ",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cir:"○",cirE:"⧃",cire:"≗",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",colon:":",Colon:"∷",Colone:"⩴",colone:"≔",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",conint:"∮",Conint:"∯",ContourIntegral:"∮",copf:"𝕔",Copf:"ℂ",coprod:"∐",Coproduct:"∐",copy:"©",COPY:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",cross:"✗",Cross:"⨯",Cscr:"𝒞",cscr:"𝒸",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",cupbrcap:"⩈",cupcap:"⩆",CupCap:"≍",cup:"∪",Cup:"⋓",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",dagger:"†",Dagger:"‡",daleth:"ℸ",darr:"↓",Darr:"↡",dArr:"⇓",dash:"‐",Dashv:"⫤",dashv:"⊣",dbkarow:"⤏",dblac:"˝",Dcaron:"Ď",dcaron:"ď",Dcy:"Д",dcy:"д",ddagger:"‡",ddarr:"⇊",DD:"ⅅ",dd:"ⅆ",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",Delta:"Δ",delta:"δ",demptyv:"⦱",dfisht:"⥿",Dfr:"𝔇",dfr:"𝔡",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",diamond:"⋄",Diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",DJcy:"Ђ",djcy:"ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",Dopf:"𝔻",dopf:"𝕕",Dot:"¨",dot:"˙",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",DownArrowBar:"⤓",downarrow:"↓",DownArrow:"↓",Downarrow:"⇓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVectorBar:"⥖",DownLeftVector:"↽",DownRightTeeVector:"⥟",DownRightVectorBar:"⥗",DownRightVector:"⇁",DownTeeArrow:"↧",DownTee:"⊤",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",Dscr:"𝒟",dscr:"𝒹",DScy:"Ѕ",dscy:"ѕ",dsol:"⧶",Dstrok:"Đ",dstrok:"đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",DZcy:"Џ",dzcy:"џ",dzigrarr:"⟿",Eacute:"É",eacute:"é",easter:"⩮",Ecaron:"Ě",ecaron:"ě",Ecirc:"Ê",ecirc:"ê",ecir:"≖",ecolon:"≕",Ecy:"Э",ecy:"э",eDDot:"⩷",Edot:"Ė",edot:"ė",eDot:"≑",ee:"ⅇ",efDot:"≒",Efr:"𝔈",efr:"𝔢",eg:"⪚",Egrave:"È",egrave:"è",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",Emacr:"Ē",emacr:"ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp13:" ",emsp14:" ",emsp:" ",ENG:"Ŋ",eng:"ŋ",ensp:" ",Eogon:"Ę",eogon:"ę",Eopf:"𝔼",eopf:"𝕖",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",Epsilon:"Ε",epsilon:"ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",escr:"ℯ",Escr:"ℰ",esdot:"≐",Esim:"⩳",esim:"≂",Eta:"Η",eta:"η",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",exponentiale:"ⅇ",ExponentialE:"ⅇ",fallingdotseq:"≒",Fcy:"Ф",fcy:"ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",Ffr:"𝔉",ffr:"𝔣",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",Fopf:"𝔽",fopf:"𝕗",forall:"∀",ForAll:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",fscr:"𝒻",Fscr:"ℱ",gacute:"ǵ",Gamma:"Γ",gamma:"γ",Gammad:"Ϝ",gammad:"ϝ",gap:"⪆",Gbreve:"Ğ",gbreve:"ğ",Gcedil:"Ģ",Gcirc:"Ĝ",gcirc:"ĝ",Gcy:"Г",gcy:"г",Gdot:"Ġ",gdot:"ġ",ge:"≥",gE:"≧",gEl:"⪌",gel:"⋛",geq:"≥",geqq:"≧",geqslant:"⩾",gescc:"⪩",ges:"⩾",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",Gfr:"𝔊",gfr:"𝔤",gg:"≫",Gg:"⋙",ggg:"⋙",gimel:"ℷ",GJcy:"Ѓ",gjcy:"ѓ",gla:"⪥",gl:"≷",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gne:"⪈",gnE:"≩",gneq:"⪈",gneqq:"≩",gnsim:"⋧",Gopf:"𝔾",gopf:"𝕘",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",Gscr:"𝒢",gscr:"ℊ",gsim:"≳",gsime:"⪎",gsiml:"⪐",gtcc:"⪧",gtcir:"⩺",gt:">",GT:">",Gt:"≫",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",HARDcy:"Ъ",hardcy:"ъ",harrcir:"⥈",harr:"↔",hArr:"⇔",harrw:"↭",Hat:"^",hbar:"ℏ",Hcirc:"Ĥ",hcirc:"ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",hfr:"𝔥",Hfr:"ℌ",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",hopf:"𝕙",Hopf:"ℍ",horbar:"―",HorizontalLine:"─",hscr:"𝒽",Hscr:"ℋ",hslash:"ℏ",Hstrok:"Ħ",hstrok:"ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",Iacute:"Í",iacute:"í",ic:"⁣",Icirc:"Î",icirc:"î",Icy:"И",icy:"и",Idot:"İ",IEcy:"Е",iecy:"е",iexcl:"¡",iff:"⇔",ifr:"𝔦",Ifr:"ℑ",Igrave:"Ì",igrave:"ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",IJlig:"Ĳ",ijlig:"ĳ",Imacr:"Ī",imacr:"ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",Im:"ℑ",imof:"⊷",imped:"Ƶ",Implies:"⇒",incare:"℅",in:"∈",infin:"∞",infintie:"⧝",inodot:"ı",intcal:"⊺",int:"∫",Int:"∬",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",IOcy:"Ё",iocy:"ё",Iogon:"Į",iogon:"į",Iopf:"𝕀",iopf:"𝕚",Iota:"Ι",iota:"ι",iprod:"⨼",iquest:"¿",iscr:"𝒾",Iscr:"ℐ",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",Itilde:"Ĩ",itilde:"ĩ",Iukcy:"І",iukcy:"і",Iuml:"Ï",iuml:"ï",Jcirc:"Ĵ",jcirc:"ĵ",Jcy:"Й",jcy:"й",Jfr:"𝔍",jfr:"𝔧",jmath:"ȷ",Jopf:"𝕁",jopf:"𝕛",Jscr:"𝒥",jscr:"𝒿",Jsercy:"Ј",jsercy:"ј",Jukcy:"Є",jukcy:"є",Kappa:"Κ",kappa:"κ",kappav:"ϰ",Kcedil:"Ķ",kcedil:"ķ",Kcy:"К",kcy:"к",Kfr:"𝔎",kfr:"𝔨",kgreen:"ĸ",KHcy:"Х",khcy:"х",KJcy:"Ќ",kjcy:"ќ",Kopf:"𝕂",kopf:"𝕜",Kscr:"𝒦",kscr:"𝓀",lAarr:"⇚",Lacute:"Ĺ",lacute:"ĺ",laemptyv:"⦴",lagran:"ℒ",Lambda:"Λ",lambda:"λ",lang:"⟨",Lang:"⟪",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",larrb:"⇤",larrbfs:"⤟",larr:"←",Larr:"↞",lArr:"⇐",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",latail:"⤙",lAtail:"⤛",lat:"⪫",late:"⪭",lates:"⪭︀",lbarr:"⤌",lBarr:"⤎",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",Lcaron:"Ľ",lcaron:"ľ",Lcedil:"Ļ",lcedil:"ļ",lceil:"⌈",lcub:"{",Lcy:"Л",lcy:"л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",le:"≤",lE:"≦",LeftAngleBracket:"⟨",LeftArrowBar:"⇤",leftarrow:"←",LeftArrow:"←",Leftarrow:"⇐",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVectorBar:"⥙",LeftDownVector:"⇃",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",leftrightarrow:"↔",LeftRightArrow:"↔",Leftrightarrow:"⇔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTeeArrow:"↤",LeftTee:"⊣",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangleBar:"⧏",LeftTriangle:"⊲",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVectorBar:"⥘",LeftUpVector:"↿",LeftVectorBar:"⥒",LeftVector:"↼",lEg:"⪋",leg:"⋚",leq:"≤",leqq:"≦",leqslant:"⩽",lescc:"⪨",les:"⩽",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",Lfr:"𝔏",lfr:"𝔩",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",LJcy:"Љ",ljcy:"љ",llarr:"⇇",ll:"≪",Ll:"⋘",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",Lmidot:"Ŀ",lmidot:"ŀ",lmoustache:"⎰",lmoust:"⎰",lnap:"⪉",lnapprox:"⪉",lne:"⪇",lnE:"≨",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",longleftarrow:"⟵",LongLeftArrow:"⟵",Longleftarrow:"⟸",longleftrightarrow:"⟷",LongLeftRightArrow:"⟷",Longleftrightarrow:"⟺",longmapsto:"⟼",longrightarrow:"⟶",LongRightArrow:"⟶",Longrightarrow:"⟹",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",Lopf:"𝕃",lopf:"𝕝",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",lscr:"𝓁",Lscr:"ℒ",lsh:"↰",Lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",Lstrok:"Ł",lstrok:"ł",ltcc:"⪦",ltcir:"⩹",lt:"<",LT:"<",Lt:"≪",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",Map:"⤅",map:"↦",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",Mcy:"М",mcy:"м",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",Mfr:"𝔐",mfr:"𝔪",mho:"℧",micro:"µ",midast:"*",midcir:"⫰",mid:"∣",middot:"·",minusb:"⊟",minus:"−",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",Mopf:"𝕄",mopf:"𝕞",mp:"∓",mscr:"𝓂",Mscr:"ℳ",mstpos:"∾",Mu:"Μ",mu:"μ",multimap:"⊸",mumap:"⊸",nabla:"∇",Nacute:"Ń",nacute:"ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natural:"♮",naturals:"ℕ",natur:"♮",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",Ncaron:"Ň",ncaron:"ň",Ncedil:"Ņ",ncedil:"ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",Ncy:"Н",ncy:"н",ndash:"–",nearhk:"⤤",nearr:"↗",neArr:"⇗",nearrow:"↗",ne:"≠",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",Nfr:"𝔑",nfr:"𝔫",ngE:"≧̸",nge:"≱",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",nGt:"≫⃒",ngt:"≯",ngtr:"≯",nGtv:"≫̸",nharr:"↮",nhArr:"⇎",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",NJcy:"Њ",njcy:"њ",nlarr:"↚",nlArr:"⇍",nldr:"‥",nlE:"≦̸",nle:"≰",nleftarrow:"↚",nLeftarrow:"⇍",nleftrightarrow:"↮",nLeftrightarrow:"⇎",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nLt:"≪⃒",nlt:"≮",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",nopf:"𝕟",Nopf:"ℕ",Not:"⫬",not:"¬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangleBar:"⧏̸",NotLeftTriangle:"⋪",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangleBar:"⧐̸",NotRightTriangle:"⋫",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",nparallel:"∦",npar:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",nprec:"⊀",npreceq:"⪯̸",npre:"⪯̸",nrarrc:"⤳̸",nrarr:"↛",nrArr:"⇏",nrarrw:"↝̸",nrightarrow:"↛",nRightarrow:"⇏",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",Nscr:"𝒩",nscr:"𝓃",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsubE:"⫅̸",nsube:"⊈",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupE:"⫆̸",nsupe:"⊉",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",Ntilde:"Ñ",ntilde:"ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",Nu:"Ν",nu:"ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nvdash:"⊬",nvDash:"⊭",nVdash:"⊮",nVDash:"⊯",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwarr:"↖",nwArr:"⇖",nwarrow:"↖",nwnear:"⤧",Oacute:"Ó",oacute:"ó",oast:"⊛",Ocirc:"Ô",ocirc:"ô",ocir:"⊚",Ocy:"О",ocy:"о",odash:"⊝",Odblac:"Ő",odblac:"ő",odiv:"⨸",odot:"⊙",odsold:"⦼",OElig:"Œ",oelig:"œ",ofcir:"⦿",Ofr:"𝔒",ofr:"𝔬",ogon:"˛",Ograve:"Ò",ograve:"ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",Omacr:"Ō",omacr:"ō",Omega:"Ω",omega:"ω",Omicron:"Ο",omicron:"ο",omid:"⦶",ominus:"⊖",Oopf:"𝕆",oopf:"𝕠",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",orarr:"↻",Or:"⩔",or:"∨",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",Oscr:"𝒪",oscr:"ℴ",Oslash:"Ø",oslash:"ø",osol:"⊘",Otilde:"Õ",otilde:"õ",otimesas:"⨶",Otimes:"⨷",otimes:"⊗",Ouml:"Ö",ouml:"ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",para:"¶",parallel:"∥",par:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",Pcy:"П",pcy:"п",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",Pfr:"𝔓",pfr:"𝔭",Phi:"Φ",phi:"φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",Pi:"Π",pi:"π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plus:"+",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",popf:"𝕡",Popf:"ℙ",pound:"£",prap:"⪷",Pr:"⪻",pr:"≺",prcue:"≼",precapprox:"⪷",prec:"≺",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",pre:"⪯",prE:"⪳",precsim:"≾",prime:"′",Prime:"″",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportional:"∝",Proportion:"∷",propto:"∝",prsim:"≾",prurel:"⊰",Pscr:"𝒫",pscr:"𝓅",Psi:"Ψ",psi:"ψ",puncsp:" ",Qfr:"𝔔",qfr:"𝔮",qint:"⨌",qopf:"𝕢",Qopf:"ℚ",qprime:"⁗",Qscr:"𝒬",qscr:"𝓆",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",quot:'"',QUOT:'"',rAarr:"⇛",race:"∽̱",Racute:"Ŕ",racute:"ŕ",radic:"√",raemptyv:"⦳",rang:"⟩",Rang:"⟫",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarr:"→",Rarr:"↠",rArr:"⇒",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",Rarrtl:"⤖",rarrtl:"↣",rarrw:"↝",ratail:"⤚",rAtail:"⤜",ratio:"∶",rationals:"ℚ",rbarr:"⤍",rBarr:"⤏",RBarr:"⤐",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",Rcaron:"Ř",rcaron:"ř",Rcedil:"Ŗ",rcedil:"ŗ",rceil:"⌉",rcub:"}",Rcy:"Р",rcy:"р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",Re:"ℜ",rect:"▭",reg:"®",REG:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",rfr:"𝔯",Rfr:"ℜ",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",Rho:"Ρ",rho:"ρ",rhov:"ϱ",RightAngleBracket:"⟩",RightArrowBar:"⇥",rightarrow:"→",RightArrow:"→",Rightarrow:"⇒",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVectorBar:"⥕",RightDownVector:"⇂",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTeeArrow:"↦",RightTee:"⊢",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangleBar:"⧐",RightTriangle:"⊳",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVectorBar:"⥔",RightUpVector:"↾",RightVectorBar:"⥓",RightVector:"⇀",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoustache:"⎱",rmoust:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",ropf:"𝕣",Ropf:"ℝ",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",rscr:"𝓇",Rscr:"ℛ",rsh:"↱",Rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",Sacute:"Ś",sacute:"ś",sbquo:"‚",scap:"⪸",Scaron:"Š",scaron:"š",Sc:"⪼",sc:"≻",sccue:"≽",sce:"⪰",scE:"⪴",Scedil:"Ş",scedil:"ş",Scirc:"Ŝ",scirc:"ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",Scy:"С",scy:"с",sdotb:"⊡",sdot:"⋅",sdote:"⩦",searhk:"⤥",searr:"↘",seArr:"⇘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",Sfr:"𝔖",sfr:"𝔰",sfrown:"⌢",sharp:"♯",SHCHcy:"Щ",shchcy:"щ",SHcy:"Ш",shcy:"ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",Sigma:"Σ",sigma:"σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",SOFTcy:"Ь",softcy:"ь",solbar:"⌿",solb:"⧄",sol:"/",Sopf:"𝕊",sopf:"𝕤",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",square:"□",Square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squ:"□",squf:"▪",srarr:"→",Sscr:"𝒮",sscr:"𝓈",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",Star:"⋆",star:"☆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",sub:"⊂",Sub:"⋐",subdot:"⪽",subE:"⫅",sube:"⊆",subedot:"⫃",submult:"⫁",subnE:"⫋",subne:"⊊",subplus:"⪿",subrarr:"⥹",subset:"⊂",Subset:"⋐",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succapprox:"⪸",succ:"≻",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",sum:"∑",Sum:"∑",sung:"♪",sup1:"¹",sup2:"²",sup3:"³",sup:"⊃",Sup:"⋑",supdot:"⪾",supdsub:"⫘",supE:"⫆",supe:"⊇",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supnE:"⫌",supne:"⊋",supplus:"⫀",supset:"⊃",Supset:"⋑",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swarr:"↙",swArr:"⇙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",Tau:"Τ",tau:"τ",tbrk:"⎴",Tcaron:"Ť",tcaron:"ť",Tcedil:"Ţ",tcedil:"ţ",Tcy:"Т",tcy:"т",tdot:"⃛",telrec:"⌕",Tfr:"𝔗",tfr:"𝔱",there4:"∴",therefore:"∴",Therefore:"∴",Theta:"Θ",theta:"θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",ThinSpace:" ",thinsp:" ",thkap:"≈",thksim:"∼",THORN:"Þ",thorn:"þ",tilde:"˜",Tilde:"∼",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",timesbar:"⨱",timesb:"⊠",times:"×",timesd:"⨰",tint:"∭",toea:"⤨",topbot:"⌶",topcir:"⫱",top:"⊤",Topf:"𝕋",topf:"𝕥",topfork:"⫚",tosa:"⤩",tprime:"‴",trade:"™",TRADE:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",Tscr:"𝒯",tscr:"𝓉",TScy:"Ц",tscy:"ц",TSHcy:"Ћ",tshcy:"ћ",Tstrok:"Ŧ",tstrok:"ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",Uacute:"Ú",uacute:"ú",uarr:"↑",Uarr:"↟",uArr:"⇑",Uarrocir:"⥉",Ubrcy:"Ў",ubrcy:"ў",Ubreve:"Ŭ",ubreve:"ŭ",Ucirc:"Û",ucirc:"û",Ucy:"У",ucy:"у",udarr:"⇅",Udblac:"Ű",udblac:"ű",udhar:"⥮",ufisht:"⥾",Ufr:"𝔘",ufr:"𝔲",Ugrave:"Ù",ugrave:"ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",Umacr:"Ū",umacr:"ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",Uogon:"Ų",uogon:"ų",Uopf:"𝕌",uopf:"𝕦",UpArrowBar:"⤒",uparrow:"↑",UpArrow:"↑",Uparrow:"⇑",UpArrowDownArrow:"⇅",updownarrow:"↕",UpDownArrow:"↕",Updownarrow:"⇕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",upsi:"υ",Upsi:"ϒ",upsih:"ϒ",Upsilon:"Υ",upsilon:"υ",UpTeeArrow:"↥",UpTee:"⊥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",Uring:"Ů",uring:"ů",urtri:"◹",Uscr:"𝒰",uscr:"𝓊",utdot:"⋰",Utilde:"Ũ",utilde:"ũ",utri:"▵",utrif:"▴",uuarr:"⇈",Uuml:"Ü",uuml:"ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",varr:"↕",vArr:"⇕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",vBar:"⫨",Vbar:"⫫",vBarv:"⫩",Vcy:"В",vcy:"в",vdash:"⊢",vDash:"⊨",Vdash:"⊩",VDash:"⊫",Vdashl:"⫦",veebar:"⊻",vee:"∨",Vee:"⋁",veeeq:"≚",vellip:"⋮",verbar:"|",Verbar:"‖",vert:"|",Vert:"‖",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",Vfr:"𝔙",vfr:"𝔳",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",Vopf:"𝕍",vopf:"𝕧",vprop:"∝",vrtri:"⊳",Vscr:"𝒱",vscr:"𝓋",vsubnE:"⫋︀",vsubne:"⊊︀",vsupnE:"⫌︀",vsupne:"⊋︀",Vvdash:"⊪",vzigzag:"⦚",Wcirc:"Ŵ",wcirc:"ŵ",wedbar:"⩟",wedge:"∧",Wedge:"⋀",wedgeq:"≙",weierp:"℘",Wfr:"𝔚",wfr:"𝔴",Wopf:"𝕎",wopf:"𝕨",wp:"℘",wr:"≀",wreath:"≀",Wscr:"𝒲",wscr:"𝓌",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",Xfr:"𝔛",xfr:"𝔵",xharr:"⟷",xhArr:"⟺",Xi:"Ξ",xi:"ξ",xlarr:"⟵",xlArr:"⟸",xmap:"⟼",xnis:"⋻",xodot:"⨀",Xopf:"𝕏",xopf:"𝕩",xoplus:"⨁",xotime:"⨂",xrarr:"⟶",xrArr:"⟹",Xscr:"𝒳",xscr:"𝓍",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",Yacute:"Ý",yacute:"ý",YAcy:"Я",yacy:"я",Ycirc:"Ŷ",ycirc:"ŷ",Ycy:"Ы",ycy:"ы",yen:"¥",Yfr:"𝔜",yfr:"𝔶",YIcy:"Ї",yicy:"ї",Yopf:"𝕐",yopf:"𝕪",Yscr:"𝒴",yscr:"𝓎",YUcy:"Ю",yucy:"ю",yuml:"ÿ",Yuml:"Ÿ",Zacute:"Ź",zacute:"ź",Zcaron:"Ž",zcaron:"ž",Zcy:"З",zcy:"з",Zdot:"Ż",zdot:"ż",zeetrf:"ℨ",ZeroWidthSpace:"​",Zeta:"Ζ",zeta:"ζ",zfr:"𝔷",Zfr:"ℨ",ZHcy:"Ж",zhcy:"ж",zigrarr:"⇝",zopf:"𝕫",Zopf:"ℤ",Zscr:"𝒵",zscr:"𝓏",zwj:"‍",zwnj:"‌"};},{}],17:[function(require,module,exports){module.exports={Aacute:"Á",aacute:"á",Acirc:"Â",acirc:"â",acute:"´",AElig:"Æ",aelig:"æ",Agrave:"À",agrave:"à",amp:"&",AMP:"&",Aring:"Å",aring:"å",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",brvbar:"¦",Ccedil:"Ç",ccedil:"ç",cedil:"¸",cent:"¢",copy:"©",COPY:"©",curren:"¤",deg:"°",divide:"÷",Eacute:"É",eacute:"é",Ecirc:"Ê",ecirc:"ê",Egrave:"È",egrave:"è",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",frac12:"½",frac14:"¼",frac34:"¾",gt:">",GT:">",Iacute:"Í",iacute:"í",Icirc:"Î",icirc:"î",iexcl:"¡",Igrave:"Ì",igrave:"ì",iquest:"¿",Iuml:"Ï",iuml:"ï",laquo:"«",lt:"<",LT:"<",macr:"¯",micro:"µ",middot:"·",nbsp:" ",not:"¬",Ntilde:"Ñ",ntilde:"ñ",Oacute:"Ó",oacute:"ó",Ocirc:"Ô",ocirc:"ô",Ograve:"Ò",ograve:"ò",ordf:"ª",ordm:"º",Oslash:"Ø",oslash:"ø",Otilde:"Õ",otilde:"õ",Ouml:"Ö",ouml:"ö",para:"¶",plusmn:"±",pound:"£",quot:'"',QUOT:'"',raquo:"»",reg:"®",REG:"®",sect:"§",shy:"­",sup1:"¹",sup2:"²",sup3:"³",szlig:"ß",THORN:"Þ",thorn:"þ",times:"×",Uacute:"Ú",uacute:"ú",Ucirc:"Û",ucirc:"û",Ugrave:"Ù",ugrave:"ù",uml:"¨",Uuml:"Ü",uuml:"ü",Yacute:"Ý",yacute:"ý",yen:"¥",yuml:"ÿ"};},{}],18:[function(require,module,exports){module.exports={amp:"&",apos:"'",gt:">",lt:"<",quot:'"'};},{}],19:[function(require,module,exports){function getDecodeCache(exclude){var i,ch,cache=decodeCache[exclude];if(cache)return cache;for(cache=decodeCache[exclude]=[],i=0;i<128;i++)ch=String.fromCharCode(i),cache.push(ch);for(i=0;i<exclude.length;i++)cache[ch=exclude.charCodeAt(i)]="%"+("0"+ch.toString(16).toUpperCase()).slice(-2);return cache}function decode(string,exclude){var cache;return "string"!=typeof exclude&&(exclude=decode.defaultChars),cache=getDecodeCache(exclude),string.replace(/(%[a-f0-9]{2})+/gi,function(seq){var i,l,b1,b2,b3,b4,chr,result="";for(i=0,l=seq.length;i<l;i+=3)(b1=parseInt(seq.slice(i+1,i+3),16))<128?result+=cache[b1]:192==(224&b1)&&i+3<l&&128==(192&(b2=parseInt(seq.slice(i+4,i+6),16)))?(result+=(chr=b1<<6&1984|63&b2)<128?"��":String.fromCharCode(chr),i+=3):224==(240&b1)&&i+6<l&&(b2=parseInt(seq.slice(i+4,i+6),16),b3=parseInt(seq.slice(i+7,i+9),16),128==(192&b2)&&128==(192&b3))?(result+=(chr=b1<<12&61440|b2<<6&4032|63&b3)<2048||chr>=55296&&chr<=57343?"���":String.fromCharCode(chr),i+=6):240==(248&b1)&&i+9<l&&(b2=parseInt(seq.slice(i+4,i+6),16),b3=parseInt(seq.slice(i+7,i+9),16),b4=parseInt(seq.slice(i+10,i+12),16),128==(192&b2)&&128==(192&b3)&&128==(192&b4))?((chr=b1<<18&1835008|b2<<12&258048|b3<<6&4032|63&b4)<65536||chr>1114111?result+="����":(chr-=65536,result+=String.fromCharCode(55296+(chr>>10),56320+(1023&chr))),i+=9):result+="�";return result})}var decodeCache={};decode.defaultChars=";/?:@&=+$,#",decode.componentChars="",module.exports=decode;},{}],20:[function(require,module,exports){function getEncodeCache(exclude){var i,ch,cache=encodeCache[exclude];if(cache)return cache;for(cache=encodeCache[exclude]=[],i=0;i<128;i++)ch=String.fromCharCode(i),cache.push(/^[0-9a-z]$/i.test(ch)?ch:"%"+("0"+i.toString(16).toUpperCase()).slice(-2));for(i=0;i<exclude.length;i++)cache[exclude.charCodeAt(i)]=exclude[i];return cache}function encode(string,exclude,keepEscaped){var i,l,code,nextCode,cache,result="";for("string"!=typeof exclude&&(keepEscaped=exclude,exclude=encode.defaultChars),void 0===keepEscaped&&(keepEscaped=!0),cache=getEncodeCache(exclude),i=0,l=string.length;i<l;i++)if(code=string.charCodeAt(i),keepEscaped&&37===code&&i+2<l&&/^[0-9a-f]{2}$/i.test(string.slice(i+1,i+3)))result+=string.slice(i,i+3),i+=2;else if(code<128)result+=cache[code];else if(code>=55296&&code<=57343){if(code>=55296&&code<=56319&&i+1<l&&(nextCode=string.charCodeAt(i+1))>=56320&&nextCode<=57343){result+=encodeURIComponent(string[i]+string[i+1]),i++;continue}result+="%EF%BF%BD";}else result+=encodeURIComponent(string[i]);return result}var encodeCache={};encode.defaultChars=";/?:@&=+$,-_.!~*'()#",encode.componentChars="-_.!~*'()",module.exports=encode;},{}],21:[function(require,module,exports){String.prototype.repeat||function(){var defineProperty=function(){try{var object={},$defineProperty=Object.defineProperty,result=$defineProperty(object,object,object)&&$defineProperty;}catch(error){}return result}(),repeat=function(count){if(null==this)throw TypeError();var string=String(this),n=count?Number(count):0;if(n!=n&&(n=0),n<0||n==1/0)throw RangeError();for(var result="";n;)n%2==1&&(result+=string),n>1&&(string+=string),n>>=1;return result};defineProperty?defineProperty(String.prototype,"repeat",{value:repeat,configurable:!0,writable:!0}):String.prototype.repeat=repeat;}();},{}]},{},[4])(4)});
});

function render(node) {
	let tmp = document.createElement("div");
	tmp.innerHTML = markdown(node.textContent.trim());
	let container = node.parentNode;
	let nodes = [].slice.call(tmp.childNodes);
	nodes.forEach(el => {
		container.insertBefore(el, node);
	});
	container.removeChild(node);
	return nodes;
}
function markdown(txt, { safe = true, smart = true } = {}) {
	let reader = new commonmark_min.Parser({ smart });
	let parsed = reader.parse(txt);
	let writer = new commonmark_min.HtmlRenderer({ safe });
	return writer.render(parsed);
}

function find(node, selector) {
	let nodes = node.querySelectorAll(selector);
	return [].slice.call(nodes);
}
function replaceNode(oldNode, ...newNodes) {
	let container = oldNode.parentNode;
	newNodes.forEach(node => {
		container.insertBefore(node, oldNode);
	});
	container.removeChild(oldNode);
}

function html2dom(parts, ...values) {
	let html = parts.reduce((memo, part, i) => {
		let val = values[i];
		let blank = val === undefined || val === null || val === false;
		return memo.concat(blank ? [part] : [part, val]);
	}, []).join("");
	let tmp = document.createElement("div");
	tmp.innerHTML = html.trim();
	return tmp.childNodes[0];
}

class Quaynaut extends HTMLElement {
	connectedCallback() {
		let { markdownSelector, slideTag } = this;
		let toggle = html2dom`<a class="${this.toggleClass}"
				href="#${this.sid(1)}" data-alt="📽️">📃</a>`;
		find(this, markdownSelector).forEach(md => {
			if(md.closest(slideTag)) {
				return;
			}
			let slide = document.createElement(slideTag);
			wrap(md, slide);
			transferAttributes(md, slide, { exclude: "data-markdown" });
			let nodes = render(md);
			let container;
			nodes.forEach(node => {
				if(container) {
					container.appendChild(node);
				} else if(node.nodeName === "HR") {
					container = html2dom`<div class="notes"></div>`;
					replaceNode(node, container);
				}
			});
		});
		let slides = find(this, slideTag);
		let penultimate = slides.length - 1;
		slides.forEach((slide, i) => {
			if(i === 0) {
				slide.appendChild(toggle);
			}
			let id = i + 1;
			slide.id = this.sid(id);
			slide.appendChild(html2dom`
<nav class="${this.navClass}">
	${i !== 0 &&
			`<a rel="prev" href="#${this.sid(id - 1)}">previous</a>`}
	<a rel="self" href="#${this.sid(id)}">slide ${id}</a>
	${i !== penultimate &&
			`<a rel="next" href="#${this.sid(id + 1)}">next</a>`}
</nav>
			`);
			find(slide, markdownSelector).forEach(render);
			prism.highlightAll();
		});
		this.onMessage = this.onMessage.bind(this);
		this.onKeypress = this.onKeypress.bind(this);
		window.addEventListener("message", this.onMessage);
		document.addEventListener("keydown", this.onKeypress);
		toggle.addEventListener("click", ev => this.togglePresentationMode(true));
	}
	disconnectedCallback() {
		window.removeEventListener("message", this.onMessage);
		document.removeEventListener("keydown", this.onKeypress);
	}
	onKeypress(ev) {
		switch(ev.keyCode) {
		case 37:
			this.dispatch("CYCLE:prev");
			break;
		case 39:
			this.dispatch("CYCLE:next");
			break;
		case 80:
			this.togglePresentationMode();
			break;
		case 83:
			this.speakerView();
			break;
		}
	}
	onMessage(ev) {
		if(ev.origin !== document.location.origin) {
			return;
		}
		let msg = ev.data;
		if(msg.indexOf("INIT:") === 0) {
			let uri = msg.substr(5);
			if(uri.indexOf("#") !== 0) {
				throw new Error(`unexpected initialization parameter: \`${msg}\``);
			}
			document.location.hash = uri;
			this.classList.add("speaker-view");
			this.mainView = ev.source;
		} else if(msg.indexOf("SELECT:") === 0) {
			let id = msg.substr(7);
			this.select(id);
		}
	}
	dispatch(cmd) {
		let select = direction => {
			let id = this.cycle(direction);
			return `SELECT:${id}`;
		};
		switch(cmd) {
		case "CYCLE:prev":
			cmd = select("prev");
			break;
		case "CYCLE:next":
			cmd = select("next");
			break;
		default:
			return;
		}
		let main = this.mainView;
		if(main) {
			main.postMessage(cmd, document.location.origin);
		}
	}
	speakerView() {
		let loc = document.location;
		let uri = loc.toString();
		if(uri.indexOf("file://") === 0) {
			alert("speaker view requires Quaynaut to be served via HTTP");
			return;
		}
		let win = window.open(uri);
		win.onload = () => {
			this.cycle("next");
			this.cycle("prev");
			win.postMessage(`INIT:${loc.hash}`, loc.origin);
		};
	}
	togglePresentationMode(link) {
		let toggle = this.querySelector(`.${this.toggleClass}`);
		let alt = toggle.getAttribute("data-alt");
		toggle.setAttribute("data-alt", toggle.textContent);
		toggle.textContent = alt;
		this.classList.toggle("presentation");
		if(!link) {
			this.cycle("next");
			this.cycle("prev");
		}
	}
	cycle(direction) {
		let id = this.rel2abs(direction);
		this.select(id);
		return id;
	}
	rel2abs(direction) {
		let current = this.querySelector(":target") || this.querySelector(this.slideTag);
		let link = current.querySelector(`.${this.navClass} a[rel=${direction}]`);
		let uri = link && link.hash;
		if(uri) {
			return uri.substr(1);
		}
		let slides = find(this, this.slideTag);
		let i = direction === "prev" ? slides.length - 1 : 0;
		return slides[i].id;
	}
	select(id) {
		document.location = `#${id}`;
	}
	sid(index) {
		return "s" + index;
	}
	get markdownSelector() {
		return "pre[data-markdown]";
	}
	get toggleClass() {
		return "quaynaut-toggle";
	}
	get navClass() {
		return "quaynaut-nav";
	}
	get slideTag() {
		return "article";
	}
}
function transferAttributes(source, target, { exclude }) {
	[].forEach.call(source.attributes, ({ name, value }) => {
		if(name !== exclude) {
			target.setAttribute(name, value);
			source.removeAttribute(name);
		}
	});
}
function wrap(node, wrapper) {
	node.parentNode.insertBefore(wrapper, node);
	wrapper.appendChild(node);
}

document.addEventListener("DOMContentLoaded", () => {
	if(!window.customElements) {
		console.warn("Querynaut could not be initialized due to missing browser support");
		return;
	}
	customElements.define("quay-naut", Quaynaut);
});

}());
