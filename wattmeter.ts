
//% color=#002F5F icon="\uf243" block="Wattmeter" weight=01
namespace wattmeter
/* 230828 231007 https://github.com/calliope-net/wattmeter
[Hardware]  https://www.dfrobot.com/product-1827.html
[Datasheet] https://github.com/DFRobot/Wiki/raw/master/SEN0291/res/INA219.pdf
            Register ab Seite 18

https://www.digikey.de/de/products/detail/dfrobot/SEN0291/10279750
https://www.mouser.de/ProductDetail/426-SEN0291

https://media.digikey.com/pdf/Data%20Sheets/DFRobot%20PDFs/SEN0291_Web.pdf
https://wiki.dfrobot.com/Gravity:%20I2C%20Digital%20Wattmeter%20SKU:%20SEN0291

https://github.com/DFRobot/DFRobot_INA219
https://github.com/DFRobot/DFRobot_INA219/blob/master/Python/RespberryPi/DFRobot_INA219.py

Modul wurde geliefert mit eingestellter i2c-Adresse 0x45; DIP Schalter mit Schutzfolie zugeklebt

Calibration 
In the actual measurement environment, measurement errors come from many sources. 
However, for the Gravity: I2C Digital Wattmeter, the voltage measurement does not need to be calibrated, 
and the current measurement error mainly comes from the error of the resistance of the sampling resistor, 
which will have a significant impact on the current measurement. 
If calibration is not performed, the relative error of the maximum current measurement is about 3%. 
If a single-point linear calibration is performed using a high-precision multimeter or an electronic load, 
the linearity error of the system can be effectively eliminated, and the maximum relative error can be up to ±0.2%.

If you don't have a regulated power supply nor a DC electronic load on the hand, follow the steps below to calibrate the current measurement:
- Connect the Arduino UNO, multimeter (switch to amperemeter) and load (gas sensor, motor or LCD screen etc. ) as shown below. 
    It is recommended that the load power consumption should no less than 100mA.
- Upload the following sample code to Arduino UNO.
- Modify the value of the variable "float ina219Reading_mA = 1000;" according to the readings of the serial port print "Current" 
    and "float extMeterReading_mA = 1000;" according to the current readings of the multimeter.
- Upload the sample code to Arduino UNO again.
- Calibration finished.
[Schaltbild] https://raw.githubusercontent.com/DFRobot/Wiki/master/SEN0291/image/SEN0291_cal2_Arduino(EN).png


Code anhand der Python library und Datenblätter neu programmiert von Lutz Elßner im August, September 2023
*/ {
    export enum eADDR { Watt_x45 = 0x45, Watt_x40 = 0x40, Watt_x41 = 0x41, Watt_x44 = 0x44 }
    let n_i2cCheck: boolean = false // i2c-Check
    let n_i2cError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

    export enum eRegister {
        REG_CONFIG = 0x00,          // Config register
        REG_SHUNTVOLTAGE = 0x01,    // Shunt Voltage Register
        REG_BUSVOLTAGE = 0x02,      // Bus Voltage Register
        REG_POWER = 0x03,           // Power Register
        REG_CURRENT = 0x04,         // Current Register
        REG_CALIBRATION = 0x05      // Register Calibration
    }
    //const INA219_CONFIG_RESET = 0x8000 // Config reset register

    // ========== group="Wattmeter Konfiguration"

    //% group="Wattmeter Konfiguration"
    //% block="i2c %pADDR beim Start || Calibration %calibration_value i2c-Check %ck"
    //% pADDR.shadow="wattmeter_eADDR"
    //% calibration_value.defl=4096
    //% ck.shadow="toggleOnOff" ck.defl=1
    export function reset(pADDR: number, calibration_value?: number, ck?: boolean) {
        n_i2cCheck = (ck ? true : false) // optionaler boolean Parameter kann undefined sein
        n_i2cError = 0 // Reset Fehlercode

        //write_register(pADDR, eRegister.REG_CONFIG, INA219_CONFIG_RESET) // 0x8000
        writeCONFIGURATION(pADDR, 0x8000)
        writeCALIBRATION(pADDR, calibration_value)
    }


    // ========== group="Messwerte lesen"

    //% group="Messwerte lesen"
    //% block="i2c %pADDR Spannung U in V" weight=8
    //% pADDR.shadow="wattmeter_eADDR"
    export function get_bus_voltage_V(pADDR: number) { // get the BusVoltage （Voltage of IN- to GND)
        //return (read_ina_reg(pADDR, eRegister.REG_BUSVOLTAGE) >> 1) * 0.001            // py   0.001/2=0.0005

        // die letzten 3 Bit 2-1-0 gehögen nicht zum Messwert | - | CNVR | OVF
        return (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) >> 3) * 0.004    // cpp  0.004/8=0.0005
    }

    //% group="Messwerte lesen"
    //% block="i2c %pADDR Strom I in mA" weight=7
    //% pADDR.shadow="wattmeter_eADDR"
    export function get_current_mA(pADDR: number) { // get the Current(Current flows across IN+ and IN-)
        return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_CURRENT)
    }

    //% group="Messwerte lesen"
    //% block="i2c %pADDR Leistung P=U*I in mW" weight=6
    //% pADDR.shadow="wattmeter_eADDR"
    export function get_power_mW(pADDR: number) { // get the Current(Current flows across IN+ and IN-)
        return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_POWER) * 20
    }

    //% group="Messwerte lesen"
    //% block="i2c %pADDR Shunt Spannung U in mV" weight=4
    //% pADDR.shadow="wattmeter_eADDR"
    export function get_shunt_voltage_mV(pADDR: number) { // get the ShuntVoltage （Voltage of the sampling resistor, IN+ to NI-)
        return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_SHUNTVOLTAGE)  // py
        // return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_SHUNTVOLTAGE) * 0.01  // cpp
    }


    // ========== group="Messwerte als Text lesen"

    export enum eStatuszeile {
        //% block="V"
        v,
        //% block="mA"
        mA,
        //% block="V | mA"
        v_mA,
        //% block="mV | mW | Ready/Overflow"
        mV_mW,
        //% block="CONFIG | CALIBRATION"
        c_c
    }
    //% group="Messwerte als Text lesen"
    //% block="i2c %pADDR Text %nummer"
    //% pADDR.shadow="wattmeter_eADDR"
    //% nummer.min=0 nummer.max=2
    export function statuszeile(pADDR: number, nummer: eStatuszeile): string {
        switch (nummer) {
            case eStatuszeile.v: {
                return Math.roundWithPrecision(get_bus_voltage_V(pADDR), 2) + " V"
            }
            case eStatuszeile.mA: {
                return get_current_mA(pADDR) + "mA"
            }
            case eStatuszeile.v_mA: {
                return statuszeile(pADDR, eStatuszeile.v) + " "
                    + statuszeile(pADDR, eStatuszeile.mA)
                    + (getStatus(pADDR, eStatus.OVF) ? " OV" : "")

                //return Math.roundWithPrecision(get_bus_voltage_V(pADDR), 2) + "V "
                //    + get_current_mA(pADDR) + "mA"
                //    + (getStatus(pADDR, eStatus.OVF) ? " OV" : "")
            }
            case eStatuszeile.mV_mW: {
                return get_shunt_voltage_mV(pADDR) + "mV "
                    + get_power_mW(pADDR) + "mW "
                    + (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) & 0x07)
            }
            case eStatuszeile.c_c: {
                return read_register(pADDR, eRegister.REG_CONFIG).toHex() + " "
                    + read_register(pADDR, eRegister.REG_CALIBRATION).toHex() + " "
                    + read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_CALIBRATION)
            }
            default: return "Statuszeile"
        }
    }


    // ========== group="Status"

    export enum eStatus {
        //% block="Math Overflow Flag"
        OVF,
        //% block="Conversion Ready"
        CNVR,
        //% block="i2c connected"
        i2c_connected
    }
    //% group="Status"
    //% block="i2c %pADDR Status %pStatus"
    //% pADDR.shadow="wattmeter_eADDR"
    export function getStatus(pADDR: number, pStatus: eStatus): boolean {
        switch (pStatus) {
            case eStatus.OVF: {
                return (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) & 0x01) != 0
            }
            case eStatus.CNVR: {
                return (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) & 0x02) != 0
            }
            case eStatus.i2c_connected: {
                let bu = Buffer.create(1)
                bu.setUint8(0, 0)
                i2cWriteBuffer(pADDR, bu)
                return n_i2cError == 0
            }
            default: return false
        }
    }



    // ========== advanced=true

    // ========== group="i2c Register schreiben"

    //% group="i2c Register schreiben" advanced=true
    //% block="i2c %pADDR Configuration %value" weight=8
    //% pADDR.shadow="wattmeter_eADDR"
    //% value.defl=14751
    // inlineInputMode=external
    export function writeCONFIGURATION(pADDR: number, value: number) {
        write_register(pADDR, eRegister.REG_CONFIG, value)
    }

    //% group="i2c Register schreiben" advanced=true
    //% block="i2c %pADDR Calibration %value" weight=6
    //% pADDR.shadow="wattmeter_eADDR"
    //% value.defl=4096
    // inlineInputMode=external
    export function writeCALIBRATION(pADDR: number, value: number) {
        write_register(pADDR, eRegister.REG_CALIBRATION, value)
    }

    //% group="i2c Register schreiben" advanced=true
    //% block="i2c %pADDR Calibration ina mA %ina219Reading_mA ext mA %extMeterReading_mA" weight=4
    //% pADDR.shadow="wattmeter_eADDR"
    //% ina219Reading_mA.defl=1000 extMeterReading_mA.defl=1000
    export function linear_cal(pADDR: number, ina219Reading_mA: number, extMeterReading_mA: number) { // Linear calibration
        /*
        @param ina219_reading_mA    The current measured by INA219 (before calibration)
        @param ext_meter_reading_mA  Actual measured current
        */
        //ina219_reading_mA = float(ina219_reading_mA)
        //ext_meter_reading_mA = float(ext_meter_reading_mA)
        let cal_value = read_Register_UInt16BE(pADDR, eRegister.REG_CALIBRATION)
        if (cal_value == 0) { cal_value = 4096 }
        cal_value = Math.trunc((extMeterReading_mA / ina219Reading_mA) * cal_value) & 0xFFFE
        write_register(pADDR, eRegister.REG_CALIBRATION, cal_value)
    }



    // ========== group="i2c Register lesen"

    //% group="i2c Register lesen" advanced=true
    //% block="i2c %pADDR read Register UInt16BE %register" weight=4
    //% pADDR.shadow="wattmeter_eADDR"
    export function read_Register_UInt16BE(pADDR: number, register: eRegister): number { // return: uint16_t
        return read_register(pADDR, register).getNumber(NumberFormat.UInt16BE, 0)
    }

    //% group="i2c Register lesen" advanced=true
    //% block="i2c %pADDR read Register Int16BE %register" weight=3
    //% pADDR.shadow="wattmeter_eADDR"
    export function read_Register_mit_Vorzeichen_Int16BE(pADDR: number, register: eRegister): number { // return: int16_t
        return read_register(pADDR, register).getNumber(NumberFormat.Int16BE, 0)
    }

    //% group="i2c Register lesen" advanced=true
    //% block="i2c %pADDR read Register Buffer %register" weight=2
    //% pADDR.shadow="wattmeter_eADDR"
    export function read_register(pADDR: number, register: eRegister): Buffer { // return: Buffer
        let bu = Buffer.create(1)
        bu.setUint8(0, register)
        i2cWriteBuffer(pADDR, bu, true)
        return i2cReadBuffer(pADDR, 2)
    }



    // ========== group="i2c Adressen"

    //% blockId=wattmeter_eADDR
    //% group="i2c Adressen" advanced=true
    //% block="%pADDR" weight=6
    export function wattmeter_eADDR(pADDR: eADDR): number { return pADDR }

    //% group="i2c Adressen" advanced=true
    //% block="i2c Fehlercode" weight=2
    export function i2cError() { return n_i2cError }

    function i2cWriteBuffer(pADDR: number, buf: Buffer, repeat: boolean = false) {
        if (n_i2cError == 0) { // vorher kein Fehler
            n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
            if (n_i2cCheck && n_i2cError != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
        } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
            n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
        //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
    }

    function i2cReadBuffer(pADDR: number, size: number, repeat: boolean = false): Buffer {
        if (!n_i2cCheck || n_i2cError == 0)
            return pins.i2cReadBuffer(pADDR, size, repeat)
        else
            return Buffer.create(size)
    }


    // ========== private

    export function write_register(pADDR: number, register: eRegister, value: number) { // value: uint16_t
        let bu = Buffer.create(3)
        bu.setUint8(0, register)
        bu.setNumber(NumberFormat.UInt16BE, 1, value)
        i2cWriteBuffer(pADDR, bu)
    }


} // wattmeter.ts
