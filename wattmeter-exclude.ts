
namespace wattmeter
/*
*/
{


    // ========== advanced=true

    // ========== group="i2c Configuration Register"

    export enum eIna219BusVolRange {    // Bus Voltage Range
        bus_vol_range_16V = 0,  // Voltage range ±16V
        bus_vol_range_32V = 1   // Voltage range ±32V
        /*
        const bus_vol_range_16V = 0 // Voltage range ±16V
        const bus_vol_range_32V = 1 // Voltage range ±32V
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set bus RNG %value" weight=5
    //% value.defl=wattmeter.eIna219BusVolRange.bus_vol_range_32V
    export function set_bus_RNG(pADDR: eADDR, value: eIna219BusVolRange) { // Set BRNG (Bus Voltage Range)
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x01 << 13)   // FEDCBA9876543210 // Bit 2^13 BRNG
        conf |= value << 13     //   1
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }




    export enum eIna219PGABits {    // GAIN and range for PGA(Shunt Voltage Only)
        PGA_bits_1 = 0, // GAIN:1,Range ±40 mV
        PGA_bits_2 = 1, // GAIN:/2,Range ±80 mV
        PGA_bits_4 = 2, // GAIN:/4,Range ±160 mV
        PGA_bits_8 = 3  // GAIN:/8,Range ±320 mV
        /*
        //GAIN and range for PGA(Shunt Voltage Only)
        const PGA_bits_1 = 0 // GAIN:1,Range ±40 mV
        const PGA_bits_2 = 1 // GAIN:/2,Range ±80 mV
        const PGA_bits_4 = 2 // GAIN:/4,Range ±160 mV
        const PGA_bits_8 = 3 // GAIN:/8,Range ±320 mV     default value 11 ±320 mV
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set PGA %bits" weight=4
    //% bits.defl=wattmeter.eIna219PGABits.PGA_bits_8
    export function set_PGA(pADDR: eADDR, bits: eIna219PGABits) { // Set PGA parameter (Shunt Voltage Only)
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x03 << 11)   // FEDCBA9876543210 // Bit 2^12 PG1, 2^11 PG0
        conf |= bits << 11      //    11            // GAIN:/8,Range ±320 mV
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }





    export enum eIna219AdcBits {
        /*
        These bits adjust the Shunt ADC resolution (9-, 10-, 11-, or 12-bit) 
        or set the number of samples used when averaging results for the Shunt Voltage Register (01h).
        */
        adc_bits_9 = 0, // Resolution is 9bit
        adc_bits_10 = 1, // Resolution is 10bit
        adc_bits_11 = 2, // Resolution is 11bit
        adc_bits_12 = 3 // Resolution is 12bit
        /* 
        const adc_bits_9 = 0 // Resolution is 9bit
        const adc_bits_10 = 1 // Resolution is 10bit
        const adc_bits_11 = 2 // Resolution is 11bit
        const adc_bits_12 = 3 // Resolution is 12bit
        */
    }
    export enum eIna219AdcSample {  // Size of the sample collected by adc every time
        adc_sample_1 = 0, adc_sample_2 = 1, adc_sample_4 = 2, adc_sample_8 = 3,
        adc_sample_16 = 4, adc_sample_32 = 5, adc_sample_64 = 6, adc_sample_128 = 7
        /*
        //Size of the sample collected by adc every time                          
        const adc_sample_1 = 0
        const adc_sample_2 = 1
        const adc_sample_4 = 2
        const adc_sample_8 = 3
        const adc_sample_16 = 4
        const adc_sample_32 = 5
        const adc_sample_64 = 6
        const adc_sample_128 = 7
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set bus ADC %bits %sample" weight=3
    //% bits.defl=wattmeter.eIna219AdcBits.adc_bits_12
    export function set_bus_ADC(pADDR: eADDR, bits: eIna219AdcBits, sample: eIna219AdcSample) {
        let conf = 0
        let value = 0
        if (bits < eIna219AdcBits.adc_bits_12 && sample > eIna219AdcSample.adc_sample_1) {
            return
        }
        if (bits < eIna219AdcBits.adc_bits_12) {
            value = bits
        } else {
            value = 0x08 | sample
        }
        //lcd16x2rgb.writeText(lcd16x2rgb.eADDR_LCD.LCD_16x2, 1, 0, 4, lcd16x2rgb.eAlign.left, value.toString())
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x0f << 7)    // FEDCBA9876543210 // Bit 2^10 BADC4 - 2^7 BADC1
        conf |= value << 7      //      0011
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }

    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set shunt ADC %bits %sample" weight=2
    //% bits.defl=wattmeter.eIna219AdcBits.adc_bits_12
    export function set_shunt_ADC(pADDR: eADDR, bits: eIna219AdcBits, sample: eIna219AdcSample) {
        let conf = 0
        let value = 0
        if (bits < eIna219AdcBits.adc_bits_12 && sample > eIna219AdcSample.adc_sample_1) {
            return
        }
        if (bits < eIna219AdcBits.adc_bits_12) {
            value = bits
        } else {
            value = 0x08 | sample
        }
        //lcd16x2rgb.writeText(lcd16x2rgb.eADDR_LCD.LCD_16x2, 1, 5, 9, lcd16x2rgb.eAlign.left, value.toString())
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~(0x0f << 3)    // FEDCBA9876543210 // Bit 2^6 SADC3 - 2^3 SADC1
        conf |= value << 3      //          0011
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }



    export enum eInaMode {      // Operating Mode
        power_down = 0,             // Power-down
        shunt_vol_trig = 1,         // Shunt voltage, triggered
        bus_vol_trig = 2,           // Bus voltage, triggered
        shunt_and_bus_vol_trig = 3, // Shunt and bus, triggered
        adc_off = 4,                // ADC off (disabled)
        shunt_vol_con = 5,          // Shunt voltage, continuous
        bus_vol_con = 6,            // Bus voltage, continuous
        shunt_and_bus_vol_con = 7   // Shunt and bus, continuous
        /*
        const power_down = 0 // Power-down
        const shunt_vol_trig = 1 // Shunt voltage, triggered
        const bus_vol_trig = 2 // Bus voltage, triggered
        const shunt_and_bus_vol_trig = 3 // Shunt and bus, triggered
        const adc_off = 4 // ADC off (disabled)
        const shunt_vol_con = 5 // Shunt voltage, continuous
        const bus_vol_con = 6 // Bus voltage, continuous
        const shunt_and_bus_vol_con = 7 // Shunt and bus, continuous
        */
    }
    //% group="i2c Configuration Register" advanced=true
    //% block="i2c %pADDR set mode %mode" weight=1
    //% mode.defl=wattmeter.eInaMode.shunt_and_bus_vol_con
    export function set_mode(pADDR: eADDR, mode: eInaMode) { // Set operation Mode
        let conf = 0
        conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        conf &= ~0x07       // FEDCBA9876543210 // Bit 2^2 MODE3 - 2^0 MODE1
        conf |= mode        //              111 // Shunt and bus, continuous
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }


}