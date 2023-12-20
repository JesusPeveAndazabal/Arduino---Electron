// arduino.service.ts
import { Injectable } from '@angular/core';
import { SerialPort} from 'serialport'; 
import { ReadlineParser } from '@serialport/parser-readline'
import { ElectronService } from '../electron/electron.service';
import { Sensor } from '../../utils/global'; 

export class ArduinoDevice {
  private isRunning: boolean = false;
  private manualSetting : boolean = true;
  private sensors: number[] = [];
  private mode: number = 0;
  private port: any;
  private message_to_device : string[] = [];
  private message_from_device : any[] = [];
  private messageInterval: any;
  private SensorWatterflow: any;
  private SensorVolumen:any;

  constructor(
    public path: string,public baudrate: number,public autoOpen: boolean,
    private electronService: ElectronService,
  ) { 
      this.connectToDevice(path, baudrate,autoOpen);

  }

  private connectToDevice(port: string, baudrate: number,autoOpen : boolean): void {
    try {
      this.port = new this.electronService.serialPort.SerialPort({ path: port , baudRate: baudrate,autoOpen : autoOpen});

      // Agrega el parser readline para facilitar la lectura de líneas
      
      
      console.log('Connected to Arduino');

      //variable para instanciar el this dentro de una funcion : clearInterval()
      let instance = this;

      //Metodo suplente del while
      this.messageInterval = setInterval(function(){
        //Obtener en la variable message los datos de bufffer mediante read()
        let message: Uint8Array | null = instance.port.read();
        if(message != null){
          //Conversion de los datos de la variable message y convertirlosm a formato utf-8
          const messagedecode: string = new TextDecoder('utf-8').decode(message);
          //console.log(messagedecode);
          //Se separa por la funcion split 
          let messageBuffer = messagedecode.split('|');
          //console.log(messageBuffer);
          
          if(messageBuffer[0] == 'C'){
            instance.mode = parseInt(messageBuffer[1]);
            instance.sensors = messageBuffer[2].split(',').map((x: string) => parseInt(x, 10));
            instance.port.write(Buffer.from('OK\n', 'utf-8'));
            instance.isRunning = true;
            const parser = instance.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            instance.listenToDevice(parser);
            clearInterval(instance.messageInterval);
          }
        }else if(instance.manualSetting){
          instance.isRunning = true;
        }

      },1000);

    } catch (error) {
      console.error('Error connecting to Arduino:', error);
    }
  }


  private listenToDevice(parser: any): void {
    parser.on('data', (data: string) => {
      const values = data.trim().split('|');
      // Assuming values represent sensor readings
      //console.log(values);
      values.forEach((value : string, index : number) => {
        this.message_from_device[`${this.sensors[index]}`] = parseFloat(value);
        this.SensorWatterflow = this.message_from_device[`${2}`]
        this.SensorVolumen = this.message_from_device[`${5}`]
        console.log("Lectura del sensor de watterflow" , this.SensorWatterflow);
        console.log("Lectura del sensor de volumen" , this.SensorVolumen);
      });
      console.log('Received message from Arduino:', this.message_from_device);
    });
  }

  private getSensorWatterFlow(watterFlow:number){
    watterFlow = this.sensors[`${Sensor.WATER_FLOW}`];
    return watterFlow;
  }

  private getSensorVolumen(){
    let volumen = this.sensors[`${Sensor.VOLUME}`];
    return volumen;
  }

  public sendCommand(command: string): void {
    if (this.port && this.port.writable) {
      this.port.write(`${command}\n`, 'utf-8', (error : any) => {
        if (error) {
          console.error('Error writing to Arduino:', error);
        } else {
          console.log('Command sent to Arduino:', command);
        }
      });
    }
  }

  // Add other methods as needed based on your requirements

  public disconnect(): void {
    if (this.port) {
      this.port.close((error : any) => {
        if (error) {
          console.error('Error closing connection:', error);
        } else {
          console.log('Disconnected from Arduino');
        }
      });
    }
  }
}
