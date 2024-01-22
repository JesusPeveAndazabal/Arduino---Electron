export class Chronos {
  private _name: string | null = null;
  private _startTime: Date | null = null;
  private _start: boolean;
  private accumulator: number = 0; // En milisegundos
  work: number; // Propiedad añadida

  constructor(work: number, name: string | null = null, start: boolean = true) {
    this._name = name;
    this._start = start; // Boolean start clock on instantiation
    this.work = work;
    this.reset();
    if (this._start) {
      this.start();
    }
  }

  start(): void {
    this._startTime = new Date();
  }

  stop(): void {
    this._startTime = null;
  }

  update(): void {
    if (this._startTime) {
      const currentTime = new Date().getTime();
      this.accumulator += currentTime - this._startTime.getTime();
      this._startTime = new Date(currentTime); // Actualizar el inicio al tiempo actual
    }
  }

  reset(): void {
    this.accumulator = 0;
    this._startTime = null;
  }

  setInitial(initial: string): void {
    try {
      const parsed = initial.split(':');
      const seconds = parsed[2].split('.');
      if (seconds.length > 1) {
        this.accumulator = new Date(0, 0, 0, parseInt(parsed[0]), parseInt(parsed[1]), parseInt(seconds[0]), parseInt(seconds[1])).getTime();
      } else {
        this.accumulator = new Date(0, 0, 0, parseInt(parsed[0]), parseInt(parsed[1]), parseInt(seconds[0])).getTime();
      }
    } catch (ex) {
      console.error("timer...", ex);
    }
  }

  elapsed(): number {
    if (this._startTime) {
      this.update();
    }
    return this.accumulator;
  }

  time(): string {
    const elapsedMillis = this.elapsed();
    const hours = Math.floor(elapsedMillis / 3600000);
    const minutes = Math.floor((elapsedMillis % 3600000) / 60000);
    const seconds = Math.floor((elapsedMillis % 60000) / 1000);
    const milliseconds = elapsedMillis % 1000;
  
    // Formatear la cadena de tiempo
    return `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`;
  }
  
}
