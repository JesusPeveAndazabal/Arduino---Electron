// arduino.service.ts
import { Injectable } from '@angular/core';
import { SerialPort} from 'serialport'; 
import { ReadlineParser } from '@serialport/parser-readline'
import { ElectronService } from '../electron/electron.service';
import { ArduinoDevice } from './arduino.device';
import { Subject, Observable } from 'rxjs';
import { Sensor } from '../../utils/global';


@Injectable({
  providedIn: 'root',
})
export class ArduinoService {
  arduino1! : ArduinoDevice;
  arduino2! : ArduinoDevice;
  private sensorSubjectMap: Map<Sensor, Subject<number>> = new Map();

  constructor( private electronService: ElectronService) {
    this.setupSensorSubjects();
    this.arduino1 = new ArduinoDevice("COM23",115200,true,electronService,this);
    this.arduino2 = new ArduinoDevice("COM4",115200,true,electronService,this);
  }

  private setupSensorSubjects(): void {
      // Crear Subject para cada tipo de sensor
    const sensorTypes: Sensor[] = Object.values(Sensor)
      .filter(value => typeof value === 'number') as Sensor[];

    sensorTypes.forEach((sensorType) => {
      this.sensorSubjectMap.set(sensorType, new Subject<number>());
    });
  }

  public getSensorObservable(sensorType: Sensor): Observable<number> {
    return this.sensorSubjectMap.get(sensorType)!.asObservable();
  }

  public notifySensorValue(sensorType: Sensor, value: Sensor): void {
    console.log(`Nuevo valor para ${sensorType}: ${value}`)
    if (this.sensorSubjectMap.has(sensorType)) {
      this.sensorSubjectMap.get(sensorType)!.next(value);
    }
  }
}
