import { Injectable, Optional } from '@angular/core';

export abstract class Meta {
    abstract name: string;
}

export class KeyValueMeta extends Meta {
    name = 'keyvalue';
    constructor(private key: string, private data: any) {
        super();
    }

    get value() {
        return this.data;
    }
}

export class ContextMeta extends KeyValueMeta {
    name = 'context';
    constructor(public context: string) {
        super('context', context);
    }
}

export class LevelMeta extends KeyValueMeta {

    static DEBUG = 'DEBUG';
    static TRACE = 'TRACE';
    static INFO = 'INFO';
    static WARN = 'WARN';
    static ERROR = 'ERROR';

    name = 'level';

    constructor(level: string) {
        super('level', level);
    }
}

export class MetaAggregate {
    constructor(public readonly items: Meta[]) {}
    get(name: string): Meta {
        return this.items.find(m => m.name === name);
    }
}

@Injectable()
export class Logger {

    private metas: Meta[] = []

    constructor() {}

    context(name: string): Logger {
        const logger = new Logger();
        logger.addMeta(new ContextMeta(name));
        return logger
    }

    addMeta(meta: Meta) {
        this.metas.push(meta);
    }

    debug(message: string, ...meta: Meta[]) {
        meta.push(new LevelMeta(LevelMeta.DEBUG));
        this.log(message, ...meta);
    }

    trace(message: string, ...meta: Meta[]) {
        meta.push(new LevelMeta(LevelMeta.TRACE));
        this.log(message, ...meta);
    }

    info(mesage: string, ...meta: Meta[]) {
        meta.push(new LevelMeta(LevelMeta.INFO));
        this.log(mesage, ...meta);
    }

    warn(mesage: string, ...meta: Meta[]) {
        meta.push(new LevelMeta(LevelMeta.WARN));
        this.log(mesage, ...meta);
    }

    error(mesage: string, ...meta: Meta[]) {
        meta.push(new LevelMeta(LevelMeta.ERROR));
        this.log(mesage, ...meta);
    }

    catch(e: Error, ...meta: Meta[]) {

        meta.push(new KeyValueMeta('stack', e.stack));
        meta.push(new KeyValueMeta('error', e.name));

        this.log(e.message, ...meta);
    }

    log(message: string, ...meta: Meta[]) {

        const metas = new MetaAggregate(meta);

        this.envLog(message, metas);

        // TODO: External Log
    }

    data(name: string, data: any): Meta {
        return new KeyValueMeta(name, data);
    }

    private envLog(message: string, metas: MetaAggregate) {

        if (!window || !window.console || !window.console.group) {
            return;
        }

        const messageList = [message];

        const metaContext: ContextMeta = <ContextMeta> metas.get('context');

        if (metaContext) {
            messageList.push(`[${metaContext.value}]`);
        }

        const metaLevel: LevelMeta = <LevelMeta> metas.get('level');

        if (metaLevel) {
            messageList.unshift(`[${metaLevel.value}]`);
        }

        console.groupCollapsed(messageList.join(' '));
        metas.items.forEach(m => console.log(m));
        console.groupEnd();
    }

}
