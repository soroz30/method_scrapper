"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWebsite = scrapeWebsite;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
async function scrapeWebsite(url) {
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    try {
        const { data } = await axios_1.default.get(fullUrl);
        const $ = cheerio.load(data);
        const h1 = $('h1').first().text().trim() || 'Not found';
        let h2Text = 'Not found';
        let pText = 'Not found';
        let ctaButton = null;
        let heroContainer = $('body');
        const h1Element = $('h1').first();
        if (h1Element.length) {
            // h1Text = h1Element.text().trim();
            heroContainer = h1Element.parent();
            // Traverse up at most two levels, looking for <section> or class including "hero"
            for (let i = 0; i < 2 && heroContainer.parent(); i++) {
                const elem = heroContainer.get(0);
                if (!elem)
                    break;
                const tagName = elem.tagName?.toLowerCase() || '';
                const className = heroContainer.attr('class') || '';
                if (tagName === 'section' || className.includes('hero')) {
                    break;
                }
                heroContainer = heroContainer.parent();
            }
            console.log('Hero container found:', $.html(heroContainer).substring(0, 100) + '...');
            let h1Found = false;
            // Iterate over elements inside heroContainer after the h1
            heroContainer.find('*').each((_, elem) => {
                const el = $(elem);
                if (!h1Found) {
                    if (el.is(h1Element)) {
                        h1Found = true;
                    }
                    return;
                }
                if (h2Text === 'Not found' && el.is('h2')) {
                    h2Text = el.text().trim();
                }
                else if (pText === 'Not found' && el.is('p')) {
                    pText = el.text().trim();
                }
                else if (!ctaButton &&
                    el.is('a.btn, a.button, [class*="cta"], button, input[type="button"], input[type="submit"]')) {
                    ctaButton = el;
                }
            });
            if (h2Text === 'Not found') {
                const h2 = heroContainer.find('h2').first();
                if (h2.length) {
                    h2Text = h2.text().trim();
                }
            }
            if (pText === 'Not found') {
                const p = heroContainer.find('p').first();
                if (p.length) {
                    pText = p.text().trim();
                }
            }
            if (!ctaButton) {
                ctaButton = heroContainer
                    .find('a.btn, a.button, [class*="cta"], button, input[type="button"], input[type="submit"]')
                    .first();
            }
        }
        if (!ctaButton && h1Element.length) {
            let nextSibling = h1Element.next();
            while (nextSibling.length && !nextSibling.is('a.btn, a.button, [class*="cta"], button, input[type="button"], input[type="submit"]')) {
                nextSibling = nextSibling.next();
            }
            if (nextSibling.length) {
                ctaButton = nextSibling;
            }
        }
        // Global fallback search if still not found
        if (!ctaButton || !ctaButton.length) {
            ctaButton = $('a.btn, a.button, [class*="cta"], button, input[type="button"], input[type="submit"]').first();
        }
        let ctaText = 'Not found';
        if (ctaButton && ctaButton.length) {
            console.log('CTA button found:', $.html(ctaButton));
            ctaText = ctaButton.text().trim() || ctaButton.attr('value')?.trim() || 'No text';
        }
        let bgColor = 'Not found';
        // First check inline style on body
        const bodyInlineStyle = $('body').attr('style') || '';
        const inlineMatch = bodyInlineStyle.match(/background-color:\s*([^;]+)/i);
        if (inlineMatch) {
            bgColor = inlineMatch[1].trim();
        }
        else {
            // Check <style> tags for body CSS rule
            const styleTags = $('style');
            styleTags.each((_, tag) => {
                const cssText = $(tag).html() || '';
                const bodyCssMatch = cssText.match(/body\s*\{([^}]+)\}/i);
                if (bodyCssMatch) {
                    const ruleContent = bodyCssMatch[1];
                    const bgStyleMatch = ruleContent.match(/background-color:\s*([^;]+)/i);
                    if (bgStyleMatch) {
                        bgColor = bgStyleMatch[1].trim();
                        return false; // stop iteration once found
                    }
                }
            });
        }
        return { h1, h2Text, pText, ctaText, bgColor };
    }
    catch (error) {
        console.error(`Failed to scrape ${fullUrl}: ${error.message}`);
        return null;
    }
}
//# sourceMappingURL=scrapper.js.map