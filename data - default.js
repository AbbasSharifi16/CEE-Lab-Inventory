// Sample lab equipment data
const equipmentData = [
    // EC3625 Lab Equipment
    {
        id: 1,
        name: "Digital Multimeter DMM-1000",
        category: "Measurement Tools",
        lab: "EC3625",
        buyingDate: "2022-03-15",
        serialNumber: "DMM-2022-001",
        quantity: 5,
        price: 350.00,
        status: "Healthy",
        notes: "High precision digital multimeter for electrical measurements",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    },
    {
        id: 2,
        name: "Oscilloscope OSC-2000",
        category: "Electronic Test Equipment",
        lab: "EC3625",
        buyingDate: "2021-08-22",
        serialNumber: "OSC-2021-003",
        quantity: 2,
        price: 2500.00,
        status: "Healthy",
        notes: "4-channel digital oscilloscope with 100MHz bandwidth",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop"
    },
    {
        id: 3,
        name: "Power Supply Unit PSU-500",
        category: "Power Equipment",
        lab: "EC3625",
        buyingDate: "2020-11-10",
        serialNumber: "PSU-2020-007",
        quantity: 3,
        price: 800.00,
        status: "Troubleshooting",
        notes: "Variable DC power supply, currently showing voltage instability",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },

    // EC3630 Lab Equipment
    {
        id: 4,
        name: "Signal Generator SG-300",
        category: "Signal Processing",
        lab: "EC3630",
        buyingDate: "2023-01-12",
        serialNumber: "SG-2023-001",
        quantity: 2,
        price: 1200.00,
        status: "Healthy",
        notes: "Function generator with arbitrary waveform capability",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
        id: 5,
        name: "Spectrum Analyzer SA-100",
        category: "Frequency Analysis",
        lab: "EC3630",
        buyingDate: "2022-06-08",
        serialNumber: "SA-2022-002",
        quantity: 1,
        price: 5000.00,
        status: "Healthy",
        notes: "High-performance spectrum analyzer for RF analysis",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    },
    {
        id: 6,
        name: "Logic Analyzer LA-200",
        category: "Digital Analysis",
        lab: "EC3630",
        buyingDate: "2021-12-03",
        serialNumber: "LA-2021-004",
        quantity: 2,
        price: 1800.00,
        status: "Damaged",
        notes: "16-channel logic analyzer, needs repair on channel 8",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop"
    },

    // EC3760 Lab Equipment
    {
        id: 7,
        name: "Temperature Controller TC-150",
        category: "Environmental Control",
        lab: "EC3760",
        buyingDate: "2022-09-18",
        serialNumber: "TC-2022-005",
        quantity: 4,
        price: 650.00,
        status: "Healthy",
        notes: "Precision temperature controller for thermal testing",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
        id: 8,
        name: "Humidity Chamber HC-75",
        category: "Environmental Testing",
        lab: "EC3760",
        buyingDate: "2020-04-25",
        serialNumber: "HC-2020-002",
        quantity: 1,
        price: 8500.00,
        status: "Maintenance",
        notes: "Large humidity chamber for materials testing, scheduled maintenance",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    },
    {
        id: 9,
        name: "Data Logger DL-300",
        category: "Data Acquisition",
        lab: "EC3760",
        buyingDate: "2023-02-14",
        serialNumber: "DL-2023-003",
        quantity: 6,
        price: 450.00,
        status: "Healthy",
        notes: "Multi-channel data logger with wireless connectivity",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop"
    },

    // EC3765 Lab Equipment
    {
        id: 10,
        name: "Pressure Sensor PS-400",
        category: "Sensors",
        lab: "EC3765",
        buyingDate: "2022-07-30",
        serialNumber: "PS-2022-008",
        quantity: 8,
        price: 250.00,
        status: "Healthy",
        notes: "High-accuracy pressure sensors for fluid dynamics experiments",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
        id: 11,
        name: "Flow Meter FM-200",
        category: "Flow Measurement",
        lab: "EC3765",
        buyingDate: "2021-05-16",
        serialNumber: "FM-2021-006",
        quantity: 3,
        price: 1500.00,
        status: "Troubleshooting",
        notes: "Ultrasonic flow meter, calibration issues detected",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    },
    {
        id: 12,
        name: "Viscometer VM-100",
        category: "Material Testing",
        lab: "EC3765",
        buyingDate: "2020-10-07",
        serialNumber: "VM-2020-004",
        quantity: 2,
        price: 3200.00,
        status: "Healthy",
        notes: "Rotational viscometer for fluid characterization",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop"
    },

    // OU107 Lab Equipment
    {
        id: 13,
        name: "Microscope MC-800",
        category: "Optical Equipment",
        lab: "OU107",
        buyingDate: "2023-03-20",
        serialNumber: "MC-2023-002",
        quantity: 4,
        price: 2200.00,
        status: "Healthy",
        notes: "High-resolution optical microscope with digital imaging",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
        id: 14,
        name: "Centrifuge CF-500",
        category: "Sample Preparation",
        lab: "OU107",
        buyingDate: "2021-11-28",
        serialNumber: "CF-2021-007",
        quantity: 2,
        price: 4500.00,
        status: "Healthy",
        notes: "High-speed centrifuge for sample separation",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    },
    {
        id: 15,
        name: "Pipette Set PS-20",
        category: "Laboratory Tools",
        lab: "OU107",
        buyingDate: "2022-01-10",
        serialNumber: "PS-2022-009",
        quantity: 12,
        price: 150.00,
        status: "Damaged",
        notes: "Variable volume pipettes, 3 units need calibration",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop"
    },

    // OU106 Lab Equipment
    {
        id: 16,
        name: "Incubator IN-250",
        category: "Environmental Control",
        lab: "OU106",
        buyingDate: "2020-08-14",
        serialNumber: "IN-2020-005",
        quantity: 3,
        price: 1800.00,
        status: "Healthy",
        notes: "CO2 incubator for cell culture applications",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
        id: 17,
        name: "pH Meter PH-100",
        category: "Chemical Analysis",
        lab: "OU106",
        buyingDate: "2022-12-05",
        serialNumber: "PH-2022-010",
        quantity: 5,
        price: 300.00,
        status: "Healthy",
        notes: "Digital pH meter with automatic temperature compensation",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    },
    {
        id: 18,
        name: "Autoclave AC-400",
        category: "Sterilization",
        lab: "OU106",
        buyingDate: "2019-06-12",
        serialNumber: "AC-2019-003",
        quantity: 1,
        price: 12000.00,
        status: "Maintenance",
        notes: "Steam autoclave for equipment sterilization, annual service due",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop"
    },

    // Additional equipment for better testing
    {
        id: 19,
        name: "Balance Scale BS-200",
        category: "Measurement Tools",
        lab: "OU106",
        buyingDate: "2023-04-18",
        serialNumber: "BS-2023-004",
        quantity: 2,
        price: 850.00,
        status: "Healthy",
        notes: "Precision analytical balance for accurate weighing",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop"
    },
    {
        id: 20,
        name: "Fume Hood FH-300",
        category: "Safety Equipment",
        lab: "EC3625",
        buyingDate: "2021-03-22",
        serialNumber: "FH-2021-001",
        quantity: 2,
        price: 6500.00,
        status: "Healthy",
        notes: "Chemical fume hood with variable air flow control",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop"
    }
];

// Calculate age of equipment
function calculateAge(buyingDate) {
    const today = new Date();
    const purchaseDate = new Date(buyingDate);
    const ageInDays = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
    const ageInYears = Math.floor(ageInDays / 365);
    const remainingDays = ageInDays % 365;
    const ageInMonths = Math.floor(remainingDays / 30);
    
    if (ageInYears > 0) {
        return `${ageInYears} year${ageInYears > 1 ? 's' : ''}, ${ageInMonths} month${ageInMonths > 1 ? 's' : ''}`;
    } else if (ageInMonths > 0) {
        return `${ageInMonths} month${ageInMonths > 1 ? 's' : ''}`;
    } else {
        return `${ageInDays} day${ageInDays > 1 ? 's' : ''}`;
    }
}

// Add calculated age to each equipment item
equipmentData.forEach(item => {
    item.age = calculateAge(item.buyingDate);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = equipmentData;
}
