import * as sqlite3 from 'sqlite3';
import { DatabaseService } from '../services/database/database.service'; // Reemplaza con la ubicación real de tu servicio de base de datos

class Exchange {
    private name: string;
    private db: sqlite3.Database;
    private _asserted: boolean;

    constructor(name: string) {
        this.name = name;
        this.db = new sqlite3.Database(DatabaseService.getPathToDatabase());
        this._asserted = false;
    }

    topic(topicKey: string) {
        return new Topic(this, topicKey);
    }

    queue(bindingQuery?: any) {
        return new Queue(this, bindingQuery);
    }

    fullQuery(filterFunc: (topic: any) => any) {
        return this.db.prepare(`SELECT * FROM ${this.name} WHERE ${filterFunc.toString()}`);
    }

    publish(topicKey: string, payload: any) {
        this.assertTable();

        const stmt = this.db.prepare(`UPDATE ${this.name} SET payload = ?, updated_on = ? WHERE topic = ?`);
        const result = stmt.run(payload, new Date().toISOString(), topicKey);

        if (!result.changes) {
            const stmtInsert = this.db.prepare(`INSERT INTO ${this.name} (topic, payload, updated_on) VALUES (?, ?, ?)`);
            stmtInsert.run(topicKey, payload, new Date().toISOString());
        }
    }

    *subscription(filterFunc: (topic: any) => any) {
        this.assertTable();

        const stmt = this.db.prepare(`SELECT * FROM ${this.name} WHERE ${filterFunc.toString()}`);
        const messages = stmt.all();

        for (const message of messages) {
            yield [message.topic, message.payload];
        }
    }

    private assertTable() {
        if (this._asserted) {
            return;
        }

        // Crea la tabla si no existe
        this.db.run(`CREATE TABLE IF NOT EXISTS ${this.name} (topic TEXT PRIMARY KEY, payload TEXT, updated_on TEXT)`);
        this._asserted = true;
    }
}

class Topic {
    private key: string;
    private exchange: Exchange;

    constructor(exchange: Exchange, topicKey: string) {
        this.key = topicKey;
        this.exchange = exchange;
    }

    publish(payload: any) {
        this.exchange.publish(this.key, payload);
    }

    is_open() {
        // Puedes agregar lógica específica de SQLite aquí si es necesario
        return true;
    }
}

class Queue {
    private exchange: Exchange;
    private filterFunc: (topic: any) => any;

    constructor(exchange: Exchange, filterFunc: (topic: any) => any) {
        this.exchange = exchange;
        this.filterFunc = filterFunc;
    }

    *subscription() {
        yield* this.exchange.subscription(this.filterFunc);
    }

    fullQuery() {
        return this.exchange.fullQuery(this.filterFunc);
    }
}

export { Exchange, Topic, Queue };
