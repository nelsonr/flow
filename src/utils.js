export function curry (fn) {
    return function curried (...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        } else {
            return curried.bind(null, ...args);
        }
    };
}

export const map = curry((fn, arr) => arr.map(fn));

export const flatMap = curry((fn, arr) => arr.flatMap(fn));

export const filter = curry((fn, arr) => arr.filter(fn));

export const reduce = curry((fn, arr, val) => arr.reduce(fn, val));

export const reduceRight = curry((fn, arr, val) => arr.reduceRight(fn, val));

export const flat = (arr) => arr.flat();

export const pipe = (...fns) => (val) => fns.reduce((acc, fn) => fn(acc), val);

export function debounce (fn, timeout = 1000) {
    let t;
    
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(fn.bind(null, ...args), timeout);
    };
}

export function loadFromLocalStorage () {
    return JSON.parse(window.localStorage.getItem("flow-state"));
}

export function updateLocalStorage (state) {
    window.localStorage.setItem("flow-state", JSON.stringify(state));
}
