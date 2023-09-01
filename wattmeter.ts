
//% color=#002F5F icon="\uf243" block="Wattmeter" weight=01
namespace wattmeter
/* 230828
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
    export enum eADDR {
        Wattmeter = 0x45, Wattmeter_x40 = 0x40, Wattmeter_x41 = 0x41, Wattmeter_x44 = 0x44
    }

    export enum eRegister {
        REG_CONFIG = 0x00,          // Config register
        REG_SHUNTVOLTAGE = 0x01,    // Shunt Voltage Register
        REG_BUSVOLTAGE = 0x02,      // Bus Voltage Register
        REG_POWER = 0x03,           // Power Register
        REG_CURRENT = 0x04,         // Current Register
        REG_CALIBRATION = 0x05      // Register Calibration
    }
    //const INA219_CONFIG_RESET = 0x8000 // Config reset register

    let i2cWriteBufferError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

    //let cal_value: number = 4096 // uint16_t
    //let BusRange: number, Pga: number, Badc: number, Sadc: number, Mode: number // uint8_t


    // ========== group="Wattmeter Konfiguration"

    //% group="Wattmeter Konfiguration"
    //% block="i2c %pADDR beim Start Calibration %calibration_value" weight=8
    //% calibration_value.defl=4096
    export function reset(pADDR: eADDR, calibration_value: number) {
        //write_register(pADDR, eRegister.REG_CONFIG, INA219_CONFIG_RESET) // 0x8000
        writeCONFIGURATION(pADDR, 0x8000)
        writeCALIBRATION(pADDR, calibration_value)
    }

    //% group="Wattmeter Konfiguration"
    //% block="i2c %pADDR i2c connected" weight=6
    export function is_connected(pADDR: eADDR): boolean {
        let bu = Buffer.create(1)
        bu.setUint8(0, 0)
        i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
        return i2cWriteBufferError == 0
    }


    //% group="i2c init"
    //% block="i2c %pADDR begin"
    /* export function begin(pADDR: eADDR) { // Initialize I2C bus and configure INA219 config register before reading data
        if (!is_connected(pADDR)) {
            return false
        } else {
            cal_value = 4096
            set_bus_RNG(pADDR, eIna219BusVolRange.bus_vol_range_32V)    // 1
            set_PGA(pADDR, eIna219PGABits.PGA_bits_8)                   // 3
            set_bus_ADC(pADDR, eIna219AdcBits.adc_bits_12, eIna219AdcSample.adc_sample_8)   // 3 3
            set_shunt_ADC(pADDR, eIna219AdcBits.adc_bits_12, eIna219AdcSample.adc_sample_8) // 3 3
            set_mode(pADDR, eInaMode.shunt_and_bus_vol_con) // 7
            return true
        }
    } */




    // ========== group="i2c Messwerte lesen"

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR Spannung U in V" weight=8
    export function get_bus_voltage_V(pADDR: eADDR) { // get the BusVoltage （Voltage of IN- to GND)
        //return (read_ina_reg(pADDR, eRegister.REG_BUSVOLTAGE) >> 1) * 0.001             // py   0.001/2=0.0005

        // die letzten 3 Bit 2-1-0 gehögen nicht zum Messwert | - | CNVR | OVF
        return (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) >> 3) * 0.004    // cpp  0.004/8=0.0005
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR Strom I in mA" weight=7
    export function get_current_mA(pADDR: eADDR) { // get the Current(Current flows across IN+ and IN-)
        return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_CURRENT)
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR Leistung P=U*I in mW" weight=6
    export function get_power_mW(pADDR: eADDR) { // get the Current(Current flows across IN+ and IN-)
        return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_POWER) * 20
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR Shunt Spannung U in mV" weight=4
    export function get_shunt_voltage_mV(pADDR: eADDR) { // get the ShuntVoltage （Voltage of the sampling resistor, IN+ to NI-)
        return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_SHUNTVOLTAGE)  // py
        // return read_Register_mit_Vorzeichen_Int16BE(pADDR, eRegister.REG_SHUNTVOLTAGE) * 0.01  // cpp
    }

    export enum eFlags {
        //% block="Math Overflow Flag"
        OVF,
        //% block="Conversion Ready"
        CNVR
    }

    //% group="i2c Messwerte lesen"
    //% block="i2c %pADDR %pFlag" weight=2
    export function get_Flag(pADDR: eADDR, pFlag: eFlags): boolean {
        if (pFlag == eFlags.OVF) {
            return (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) & 0x01) != 0
        } else {
            return (read_Register_UInt16BE(pADDR, eRegister.REG_BUSVOLTAGE) & 0x02) != 0
        }
    }



    // ========== advanced=true

    // ========== group="i2c Register schreiben"

    //% group="i2c Register schreiben" advanced=true
    //% block="i2c %pADDR Configuration Register %value" weight=8
    //% value.defl=14751
    //% inlineInputMode=external
    export function writeCONFIGURATION(pADDR: eADDR, value: number) {
        write_register(pADDR, eRegister.REG_CONFIG, value)
    }

    //% group="i2c Register schreiben" advanced=true
    //% block="i2c %pADDR Calibration Register %value" weight=6
    //% value.defl=4096
    //% inlineInputMode=external
    export function writeCALIBRATION(pADDR: eADDR, value: number) {
        write_register(pADDR, eRegister.REG_CALIBRATION, value)
    }

    //% group="i2c Register schreiben" advanced=true
    //% block="i2c %pADDR Calibration ina mA %ina219Reading_mA ext mA %extMeterReading_mA" weight=4
    //% ina219Reading_mA.defl=1000 extMeterReading_mA.defl=1000
    export function linear_cal(pADDR: eADDR, ina219Reading_mA: number, extMeterReading_mA: number) { // Linear calibration
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
    export function read_Register_UInt16BE(pADDR: eADDR, register: eRegister): number { // return: uint16_t
        return read_register(pADDR, register).getNumber(NumberFormat.UInt16BE, 0)
    }

    //% group="i2c Register lesen" advanced=true
    //% block="i2c %pADDR read Register Int16BE %register" weight=3
    export function read_Register_mit_Vorzeichen_Int16BE(pADDR: eADDR, register: eRegister): number { // return: int16_t
        return read_register(pADDR, register).getNumber(NumberFormat.Int16BE, 0)
    }

    //% group="i2c Register lesen" advanced=true
    //% block="i2c %pADDR read Register Buffer %register" weight=2
    export function read_register(pADDR: eADDR, register: eRegister): Buffer { // return: Buffer
        let bu = Buffer.create(1)
        bu.setUint8(0, register)
        i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu, true)
        return pins.i2cReadBuffer(pADDR, 2)
    }





    // ========== group="i2c Adressen"

    //% group="i2c Adressen" advanced=true
    //% block="i2c Adresse von Modul %pADDR" weight=6
    export function i2cAdressen(pADDR: eADDR): number { return pADDR }

    //% group="i2c Adressen" advanced=true
    //% block="Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)" weight=2
    export function i2cError() { return i2cWriteBufferError }


    // ========== private

    export function write_register(pADDR: eADDR, register: eRegister, value: number) { // value: uint16_t
        let bu = Buffer.create(3)
        bu.setUint8(0, register)
        bu.setNumber(NumberFormat.UInt16BE, 1, value)
        i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, bu)
    }


} // wattmeter.ts
