/**
 * Compatibilidade para Node 26+ (Ada 4.0 WHATWG URL):
 * `@adonisjs/ace` usa `jsonschema@1.5.0`, que invoca `new URL(ref, 'thismessage::/')`.
 * Adaptamos apenas essa base sintética para uma base RFC válida sem alterar outros URLs.
 */
const OriginalURL = globalThis.URL

class CompatURL extends OriginalURL {
  constructor(input: string | URL, base?: string | URL) {
    if (base === 'thismessage::/') {
      super(input, 'http://thismessage.local/')
    } else {
      super(input, base)
    }
  }
}

globalThis.URL = CompatURL as typeof URL
