
export type Index<T>= { [key:string]: T}
export type Option<T> = T | undefined;


export function map<A,B>(a: Option<A>, f: (a:A) => B): Option<B> {
    return a ? f(a) : undefined;
}

export function flatMap<A,B>(a: Option<A>, f: (a:A) => Option<B>): Option<B> {
    return a ? f(a) : undefined;
}

export function getOrElse<T>(t: Option<T>, _default: T): T {
    return t ? t : _default;
}
