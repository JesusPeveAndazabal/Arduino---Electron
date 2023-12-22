
export class Trabajador {
    public id : number;
    public code : string;
    public fullname : string;


	constructor(private _id:number,private _code:string,private _fullname:string) {
        this.id=_id;
        this.code=_code;
        this.fullname = _fullname;
	}
    
}