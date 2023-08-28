
namespace wattmeter {
    //% group="i2c Configuration Register"  subcategory="Configuration"
    //% block="i2c %pADDR Configuration Register | %pBRNG | Shunt Voltage Gain and Range | %pPG | Bus ADC Resolution/Averaging | %pBADC | Shunt ADC Resolution/Averaging | %pSADC | Operating Mode | %mode"
    //% mode.defl=wattmeter.eInaMode.shunt_and_bus_vol_con
    export function config(pADDR: eADDR, pBRNG: eBRNG, pPG: ePG, pBADC: eBADC, pSADC: eSADC, pMODE: eMODE) {
        let conf = pBRNG | pPG | pBADC | pSADC | pMODE
        //conf = read_ina_reg(pADDR, eRegister.REG_CONFIG)
        //conf &= ~0x07       // FEDCBA9876543210 // Bit 2^2 MODE3 - 2^0 MODE1
        //conf |= mode        //              111 // Shunt and bus, continuous
        write_register(pADDR, eRegister.REG_CONFIG, conf)
    }


    export enum eBRNG {    // Bus Voltage Range
        //% block="Bus Voltage Range ±32V"
        bus_vol_range_32V = 0b0010000000000000,   // 1 Voltage range ±32V (default)
        //% block="Bus Voltage Range ±16V"
        bus_vol_range_16V = 0b0000000000000000  // 0 Voltage range ±16V
        /*
        const bus_vol_range_16V = 0 // Voltage range ±16V
        const bus_vol_range_32V = 1 // Voltage range ±32V
        */
    }

    export enum ePG {    // GAIN and range for PGA(Shunt Voltage Only)
        //% block="Gain:/8, Range ±320mV"
        gain_8_range_320mV = 0b0001100000000000,  // 3 GAIN:/8,Range ±320 mV (default)
        //% block="Gain: 1, Range ±40mV"
        gain_1_range_40mV = 0b0000000000000000, // 0 GAIN:1,Range ±40 mV
        //% block="Gain:/2, Range ±80mV"
        gain_2_range_80mV = 0b0000100000000000, // 1 GAIN:/2,Range ±80 mV
        //% block="Gain:/4, Range ±160mV"
        gain_4_range_160mV = 0b0001000000000000 // 2 GAIN:/4,Range ±160 mV
        /*
        //GAIN and range for PGA(Shunt Voltage Only)
        const PGA_bits_1 = 0 // GAIN:1,Range ±40 mV
        const PGA_bits_2 = 1 // GAIN:/2,Range ±80 mV
        const PGA_bits_4 = 2 // GAIN:/4,Range ±160 mV
        const PGA_bits_8 = 3 // GAIN:/8,Range ±320 mV     default value 11 ±320 mV
        */
    }

    export enum eBADC {  // Size of the sample collected by adc every time
        /*
        These bits adjust the Bus ADC resolution (9-, 10-, 11-, or 12-bit)
        or set the number of samples used when averaging results for the Bus Voltage Register (02h).
        */
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
        //               FEDCBA9876543210
        //% block="Bus Resolution 12bit, 532 µs"
        badc_bits_12 = 0b0000000110000000, // 3 Resolution is 12bit (default)
        //% block="Bus Resolution 9bit, 84 µs"
        badc_bits_9 = 0b0000000000000000, // 0 Resolution is 9bit
        //% block="Bus Resolution 10bit, 148 µs"
        badc_bits_10 = 0b0000000010000000, // 1 Resolution is 10bit
        //% block="Bus Resolution 11bit, 276 µs"
        badc_bits_11 = 0b0000000100000000, // 2 Resolution is 11bit
        //                                // 4..7 Don't care
        //Size of the sample collected by adc every time
        //% block="Bus Resolution 12bit 532 µs"
        //badc_sample_1 = 0b0000010000000000, //  8
        //% block="Bus Samples 2, 1.06 ms"
        badc_sample_2 = 0b0000010010000000, //  9
        //% block="Bus Samples 4, 2.13 ms"
        badc_sample_4 = 0b0000010100000000, // 10
        //% block="Bus Samples 8, 4.26 ms"
        badc_sample_8 = 0b0000010110000000, // 11
        //% block="Bus Samples 16, 8.51 ms"
        badc_sample_16 = 0b0000011000000000, //12
        //% block="Bus Samples 32, 17.02 ms"
        badc_sample_32 = 0b0000011010000000, //13
        //% block="Bus Samples 64, 34.05 ms"
        badc_sample_64 = 0b0000011100000000, //14
        //% block="Bus Samples 128, 68.10 ms"
        badc_sample_128 = 0b0000011110000000 //15
    }

    export enum eSADC {  // Size of the sample collected by adc every time
        /*
        These bits adjust the Shunt ADC resolution (9-, 10-, 11-, or 12-bit)
        or set the number of samples used when averaging results for the Shunt Voltage Register (01h).
        */
        //               FEDCBA9876543210
        //% block="Shunt Resolution 12bit, 532 µs"
        sadc_bits_12 = 0b0000000000011000, // 3 Resolution is 12bit (default)
        //% block="Shunt Resolution 9bit, 84 µs"
        sadc_bits_9 = 0b0000000000000000, // 0 Resolution is 9bit
        //% block="Shunt Resolution 10bit, 148 µs"
        sadc_bits_10 = 0b0000000000001000, // 1 Resolution is 10bit
        //% block="Shunt Resolution 11bit, 276 µs"
        sadc_bits_11 = 0b0000000000010000, // 2 Resolution is 11bit
        //                                // 4..7 Don't care
        //Size of the sample collected by adc every time                          
        //% block="Shunt Resolution 12bit 532 µs"
        //sadc_sample_1 = 0b0000000001000000, //  8
        //% block="Shunt Samples 2, 1.06 ms"
        sadc_sample_2 = 0b0000000001001000, //  9
        //% block="Shunt Samples 4, 2.13 ms"
        sadc_sample_4 = 0b0000000001010000, // 10
        //% block="Shunt Samples 8, 4.26 ms"
        sadc_sample_8 = 0b0000000001011000, // 11
        //% block="Shunt Samples 16, 8.51 ms"
        sadc_sample_16 = 0b0000000001100000, //12
        //% block="Shunt Samples 32, 17.02 ms"
        sadc_sample_32 = 0b0000000001101000, //13
        //% block="Shunt Samples 64, 34.05 ms"
        sadc_sample_64 = 0b0000000001110000, //14
        //% block="Shunt Samples 128, 68.10 ms"
        sadc_sample_128 = 0b0000000001111000 //15
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

    export enum eMODE {      // eInaMode Operating Mode
        //             FEDCBA9876543210
        //% block="Shunt and bus, continuous"
        shunt_and_bus_vol_con = 0b0000000000000111,   // 7 Shunt and bus, continuous (default)
        //% block="Power-down"
        power_down = 0b0000000000000000,             // 0 Power-down
        //% block="Shunt voltage, triggered"
        shunt_vol_trig = 0b0000000000000001,         // 1 Shunt voltage, triggered
        //% block="Bus voltage, triggered"
        bus_vol_trig = 0b0000000000000010,           // 2 Bus voltage, triggered
        //% block="Shunt and bus, triggered"
        shunt_and_bus_vol_trig = 0b0000000000000011, // 3 Shunt and bus, triggered
        //% block="ADC off (disabled)"
        adc_off = 0b0000000000000100,                // 4 ADC off (disabled)
        //% block="Shunt voltage, continuous"
        shunt_vol_con = 0b0000000000000101,          // 5 Shunt voltage, continuous
        //% block="Bus voltage, continuous"
        bus_vol_con = 0b0000000000000110            // 6 Bus voltage, continuous
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
}