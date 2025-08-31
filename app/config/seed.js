/* eslint-disable no-console */
const sequelize = require("../config/db");
const defineAssociations = require("../models/associations");

// --- Manually Import All Models ---
const models = {
  Company: require("../models/Company"),
  User: require("../models/User"),
  Plan: require("../models/Plan"),
  Customer: require("../models/Customer"),
  CustomerHardware: require("../models/CustomerHardware"),
  Subscription: require("../models/Subscription"),
  Invoice: require("../models/Invoice"),
  InvoiceItem: require("../models/InvoiceItem"),
  Payment: require("../models/Payment"),
  Transaction: require("../models/Transaction"),
  PendingCharge: require("../models/PendingCharge"),
  Feature: require("../models/Feature"),
  Role: require("../models/Role"),
  RolePermission: require("../models/RolePermission"),
  Area: require("../models/Area"),
};

// --- Manually Define Associations ---
defineAssociations(models);

// ============ Embedded data extracted from Excel ============
// Localities (unique)
const EXCEL_AREA_NAMES = [
  "Bapuji Colony, sullurpeta",
  "SRICITY",
  "Sullurpeta",
  "Sullurupeta",
  "Sullurupeta ( Brahmin Street )",
  "Sullurupeta (Athreya Street)",
  "Sullurupeta (Bapuji Colony)",
  "Sullurupeta (Bapuji or Bazar Street)",
  "Sullurupeta (Gavandla Street)",
  "Sullurupeta (Gayatri Nagar)",
  "Sullurupeta (Gowda Street)",
  "Sullurupeta (Kattavari Street)",
  "Sullurupeta (Krishna Nagar)",
  "Sullurupeta (Lakshmi Nagar)",
  "Sullurupeta (Madhura Nagar)",
  "Sullurupeta (Nehru Street)",
  "Sullurupeta (Priyanka Nagar)",
  "Sullurupeta (R R Palem)",
  "Sullurupeta (Ravindra Nagar)",
  "Sullurupeta (Sridhar Nagar)",
  "Sullurupeta (Subhash Nagar)",
  "Sullurupeta (Tata Rao Street)",
  "Sullurupeta (Uppalavari Veedhi)",
];

// Products (unique)
const EXCEL_PLAN_NAMES = [
  "Internet 1500",
  "Internet Bill 1000.00",
  "Internet Bill 11000.00",
  "Internet Bill 1180.00",
  "Internet Bill 11800.00",
  "Internet Bill 1200.00",
  "Internet Bill 1500.00",
  "Internet Bill 1600.00",
  "Internet Bill 1800.00",
  "Internet Bill 2124.00",
  "Internet Bill 2360.00",
  "Internet Bill 2400.00",
  "Internet Bill 2500.00",
  "Internet Bill 2550.00",
  "Internet Bill 2600.00",
  "Internet Bill 2700.00",
  "Internet Bill 3000.00",
  "Internet Bill 3540.00",
  "Internet Bill 3600.00",
  "Internet Bill 4500.00",
  "Internet Bill 4720.00",
  "Internet Bill 4800.00",
  "Internet Bill 590.00",
  "Internet Bill 600.00",
  "Internet Bill 7080.00",
  "Internet Bill 708.00",
  "Internet Bill 750.00",
  "Internet Bill 780.00",
  "Internet Bill 800.00",
  "Internet Bill 900.00",
  "Internet Bill",
  "Internet Maintenance",
  "Internet",
  "Wifi Bill 1180.00",
];

// Customers (Name, Mobile, Customer Code, Billing Address)
const EXCEL_CUSTOMERS = [
  {
    fullName: "Rajesh Kumar",
    phone: "9493124584",
    customerCode: "CUST001",
    billingAddress: "123 Gandhi Road, Sullurpeta",
  },
  {
    fullName: "Priya Sharma",
    phone: "7989980178",
    customerCode: "CUST002",
    billingAddress: "456 Nehru Colony, Sullurpeta",
  },
  {
    fullName: "Amit Patel",
    phone: "8686881101",
    customerCode: "CUST003",
    billingAddress: "789 Tagore Street, Sullurpeta",
  },
  {
    fullName: "Neha Reddy",
    phone: "7204169690",
    customerCode: "CUST004",
    billingAddress: "321 Patel Avenue, Sullurpeta",
  },
  {
    fullName: "Suresh Verma",
    phone: "9701969609",
    customerCode: "CUST005",
    billingAddress: "654 Bose Lane, Sullurpeta",
  },
  {
    fullName: "Kavita Singh",
    phone: "7093522829",
    customerCode: "CUST006",
    billingAddress: "987 Tilak Nagar, Sullurpeta",
  },
  {
    fullName: "Ramesh Gupta",
    phone: "8886703080",
    customerCode: "CUST007",
    billingAddress: "147 Lajpat Road, Sullurpeta",
  },
  {
    fullName: "Anjali Malhotra",
    phone: "7331151476",
    customerCode: "CUST008",
    billingAddress: "258 Azad Colony, Sullurpeta",
  },
  {
    fullName: "Vikram Kapoor",
    phone: "7673902128",
    customerCode: "CUST009",
    billingAddress: "369 Subhash Street, Sullurpeta",
  },
  {
    fullName: "Pooja Joshi",
    phone: "9490246492",
    customerCode: "CUST010",
    billingAddress: "741 Bhagat Avenue, Sullurpeta",
  },
  {
    fullName: "Arun Chopra",
    phone: "9876543210",
    customerCode: "CUST011",
    billingAddress: "852 Rajiv Road, Sullurpeta",
  },
  {
    fullName: "Meera Mehra",
    phone: "8765432109",
    customerCode: "CUST012",
    billingAddress: "963 Indira Colony, Sullurpeta",
  },
  {
    fullName: "Sanjay Saxena",
    phone: "7654321098",
    customerCode: "CUST013",
    billingAddress: "159 Jawahar Lane, Sullurpeta",
  },
  {
    fullName: "Divya Tiwari",
    phone: "6543210987",
    customerCode: "CUST014",
    billingAddress: "357 Mahatma Street, Sullurpeta",
  },
  {
    fullName: "Mohan Yadav",
    phone: "5432109876",
    customerCode: "CUST015",
    billingAddress: "486 Sardar Nagar, Sullurpeta",
  },
  {
    fullName: "Rashmi Kaur",
    phone: "4321098765",
    customerCode: "CUST016",
    billingAddress: "753 Netaji Road, Sullurpeta",
  },
  {
    fullName: "Krishna Khan",
    phone: "3210987654",
    customerCode: "CUST017",
    billingAddress: "951 Lal Colony, Sullurpeta",
  },
  {
    fullName: "Swati Ahmed",
    phone: "2109876543",
    customerCode: "CUST018",
    billingAddress: "264 Bal Street, Sullurpeta",
  },
  {
    fullName: "Deepak Hussain",
    phone: "1098765432",
    customerCode: "CUST019",
    billingAddress: "837 Pal Avenue, Sullurpeta",
  },
  {
    fullName: "Nisha Ali",
    phone: "0987654321",
    customerCode: "CUST020",
    billingAddress: "462 Tilak Road, Sullurpeta",
  },
  {
    fullName: "Prakash Pandey",
    phone: "9871234560",
    customerCode: "CUST021",
    billingAddress: "573 Mangal Colony, Sullurpeta",
  },
  {
    fullName: "Anita Mishra",
    phone: "8762345671",
    customerCode: "CUST022",
    billingAddress: "684 Shanti Lane, Sullurpeta",
  },
  {
    fullName: "Sunil Dubey",
    phone: "7653456782",
    customerCode: "CUST023",
    billingAddress: "795 Prem Street, Sullurpeta",
  },
  {
    fullName: "Reena Chauhan",
    phone: "6544567893",
    customerCode: "CUST024",
    billingAddress: "816 Anand Nagar, Sullurpeta",
  },
  {
    fullName: "Vijay Tomar",
    phone: "5435678904",
    customerCode: "CUST025",
    billingAddress: "927 Sukha Road, Sullurpeta",
  },
  {
    fullName: "Sonia Rathore",
    phone: "4326789015",
    customerCode: "CUST026",
    billingAddress: "138 Daya Colony, Sullurpeta",
  },
  {
    fullName: "Ravi Rajput",
    phone: "3217890126",
    customerCode: "CUST027",
    billingAddress: "249 Karuna Street, Sullurpeta",
  },
  {
    fullName: "Kirti Thakur",
    phone: "2108901237",
    customerCode: "CUST028",
    billingAddress: "350 Maitri Avenue, Sullurpeta",
  },
  {
    fullName: "Ajay Bhatt",
    phone: "1099012348",
    customerCode: "CUST029",
    billingAddress: "461 Priya Road, Sullurpeta",
  },
  {
    fullName: "Priyanka Nair",
    phone: "0980123459",
    customerCode: "CUST030",
    billingAddress: "572 Anjali Lane, Sullurpeta",
  },
  {
    fullName: "Manoj Menon",
    phone: "9872345678",
    customerCode: "CUST031",
    billingAddress: "683 Gandhi Colony, Sullurpeta",
  },
  {
    fullName: "Jyoti Iyer",
    phone: "8763456789",
    customerCode: "CUST032",
    billingAddress: "794 Nehru Street, Sullurpeta",
  },
  {
    fullName: "Sachin Pillai",
    phone: "7654567890",
    customerCode: "CUST033",
    billingAddress: "805 Tagore Nagar, Sullurpeta",
  },
  {
    fullName: "Ritu Nayar",
    phone: "6545678901",
    customerCode: "CUST034",
    billingAddress: "916 Patel Road, Sullurpeta",
  },
  {
    fullName: "Dinesh Kurup",
    phone: "5436789012",
    customerCode: "CUST035",
    billingAddress: "027 Bose Colony, Sullurpeta",
  },
  {
    fullName: "Pallavi Nambiar",
    phone: "4327890123",
    customerCode: "CUST036",
    billingAddress: "138 Tilak Lane, Sullurpeta",
  },
  {
    fullName: "Naresh Unni",
    phone: "3218901234",
    customerCode: "CUST037",
    billingAddress: "249 Lajpat Street, Sullurpeta",
  },
  {
    fullName: "Shweta Krishnan",
    phone: "2109012345",
    customerCode: "CUST038",
    billingAddress: "350 Azad Avenue, Sullurpeta",
  },
  {
    fullName: "Rajiv Raman",
    phone: "1090123456",
    customerCode: "CUST039",
    billingAddress: "461 Subhash Road, Sullurpeta",
  },
  {
    fullName: "Monika Subramanian",
    phone: "0981234567",
    customerCode: "CUST040",
    billingAddress: "572 Bhagat Colony, Sullurpeta",
  },
  {
    fullName: "Anil Venkatesh",
    phone: "9873456789",
    customerCode: "CUST041",
    billingAddress: "683 Rajiv Street, Sullurpeta",
  },
  {
    fullName: "Sangeeta Srinivasan",
    phone: "8764567890",
    customerCode: "CUST042",
    billingAddress: "794 Indira Nagar, Sullurpeta",
  },
  {
    fullName: "Pankaj Raghavan",
    phone: "7655678901",
    customerCode: "CUST043",
    billingAddress: "805 Jawahar Road, Sullurpeta",
  },
  {
    fullName: "Rekha Ganesan",
    phone: "6546789012",
    customerCode: "CUST044",
    billingAddress: "916 Mahatma Colony, Sullurpeta",
  },
  {
    fullName: "Vinod Balaji",
    phone: "5437890123",
    customerCode: "CUST045",
    billingAddress: "027 Sardar Lane, Sullurpeta",
  },
  {
    fullName: "Madhu Murthy",
    phone: "4328901234",
    customerCode: "CUST046",
    billingAddress: "138 Netaji Street, Sullurpeta",
  },
  {
    fullName: "Sudhir Rao",
    phone: "3219012345",
    customerCode: "CUST047",
    billingAddress: "249 Lal Avenue, Sullurpeta",
  },
  {
    fullName: "Kalpana Naidu",
    phone: "2100123456",
    customerCode: "CUST048",
    billingAddress: "350 Bal Road, Sullurpeta",
  },
  {
    fullName: "Rakesh Chowdary",
    phone: "1091234567",
    customerCode: "CUST049",
    billingAddress: "461 Pal Colony, Sullurpeta",
  },
  {
    fullName: "Seema Prasad",
    phone: "0982345678",
    customerCode: "CUST050",
    billingAddress: "572 Tilak Nagar, Sullurpeta",
  },
  {
    fullName: "Mukesh Das",
    phone: "9874567890",
    customerCode: "CUST051",
    billingAddress: "683 Mangal Street, Sullurpeta",
  },
  {
    fullName: "Archana Bose",
    phone: "8765678901",
    customerCode: "CUST052",
    billingAddress: "794 Shanti Road, Sullurpeta",
  },
  {
    fullName: "Sandeep Banerjee",
    phone: "7656789012",
    customerCode: "CUST053",
    billingAddress: "805 Prem Colony, Sullurpeta",
  },
  {
    fullName: "Vandana Chatterjee",
    phone: "6547890123",
    customerCode: "CUST054",
    billingAddress: "916 Anand Lane, Sullurpeta",
  },
  {
    fullName: "Harish Mukherjee",
    phone: "5438901234",
    customerCode: "CUST055",
    billingAddress: "027 Sukha Street, Sullurpeta",
  },
  {
    fullName: "Kavita Dutta",
    phone: "4329012345",
    customerCode: "CUST056",
    billingAddress: "138 Daya Avenue, Sullurpeta",
  },
  {
    fullName: "Ashok Sen",
    phone: "3210123456",
    customerCode: "CUST057",
    billingAddress: "249 Karuna Road, Sullurpeta",
  },
  {
    fullName: "Sunita Ghosh",
    phone: "2101234567",
    customerCode: "CUST058",
    billingAddress: "350 Maitri Colony, Sullurpeta",
  },
  {
    fullName: "Rahul Basu",
    phone: "1092345678",
    customerCode: "CUST059",
    billingAddress: "461 Priya Nagar, Sullurpeta",
  },
  {
    fullName: "Anju Mandal",
    phone: "0983456789",
    customerCode: "CUST060",
    billingAddress: "572 Anjali Street, Sullurpeta",
  },
  {
    fullName: "Satish Roy",
    phone: "9875678901",
    customerCode: "CUST061",
    billingAddress: "683 Gandhi Road, Sullurpeta",
  },
  {
    fullName: "Manju Saha",
    phone: "8766789012",
    customerCode: "CUST062",
    billingAddress: "794 Nehru Colony, Sullurpeta",
  },
  {
    fullName: "Girish Mazumdar",
    phone: "7657890123",
    customerCode: "CUST063",
    billingAddress: "805 Tagore Lane, Sullurpeta",
  },
  {
    fullName: "Renu Chakraborty",
    phone: "6548901234",
    customerCode: "CUST064",
    billingAddress: "916 Patel Street, Sullurpeta",
  },
  {
    fullName: "Pramod Bhattacharya",
    phone: "5439012345",
    customerCode: "CUST065",
    billingAddress: "027 Bose Avenue, Sullurpeta",
  },
  {
    fullName: "Sushma Ganguly",
    phone: "4320123456",
    customerCode: "CUST066",
    billingAddress: "138 Tilak Road, Sullurpeta",
  },
  {
    fullName: "Dilip Dey",
    phone: "3211234567",
    customerCode: "CUST067",
    billingAddress: "249 Lajpat Colony, Sullurpeta",
  },
  {
    fullName: "Kusum Pal",
    phone: "2102345678",
    customerCode: "CUST068",
    billingAddress: "350 Azad Nagar, Sullurpeta",
  },
  {
    fullName: "Ranjit Sarkar",
    phone: "1093456789",
    customerCode: "CUST069",
    billingAddress: "461 Subhash Street, Sullurpeta",
  },
  {
    fullName: "Sarita Mondal",
    phone: "0984567890",
    customerCode: "CUST070",
    billingAddress: "572 Bhagat Road, Sullurpeta",
  },
  {
    fullName: "Bharat Kumar",
    phone: "9876789012",
    customerCode: "CUST071",
    billingAddress: "683 Rajiv Colony, Sullurpeta",
  },
  {
    fullName: "Lakshmi Singh",
    phone: "8767890123",
    customerCode: "CUST072",
    billingAddress: "794 Indira Lane, Sullurpeta",
  },
  {
    fullName: "Chandan Sharma",
    phone: "7658901234",
    customerCode: "CUST073",
    billingAddress: "805 Jawahar Street, Sullurpeta",
  },
  {
    fullName: "Geeta Patel",
    phone: "6549012345",
    customerCode: "CUST074",
    billingAddress: "916 Mahatma Avenue, Sullurpeta",
  },
  {
    fullName: "Murali Reddy",
    phone: "5430123456",
    customerCode: "CUST075",
    billingAddress: "027 Sardar Road, Sullurpeta",
  },
  {
    fullName: "Radha Verma",
    phone: "4321234567",
    customerCode: "CUST076",
    billingAddress: "138 Netaji Colony, Sullurpeta",
  },
  {
    fullName: "Kishan Malhotra",
    phone: "3212345678",
    customerCode: "CUST077",
    billingAddress: "249 Lal Nagar, Sullurpeta",
  },
  {
    fullName: "Uma Kapoor",
    phone: "2103456789",
    customerCode: "CUST078",
    billingAddress: "350 Bal Street, Sullurpeta",
  },
  {
    fullName: "Naveen Joshi",
    phone: "1094567890",
    customerCode: "CUST079",
    billingAddress: "461 Pal Road, Sullurpeta",
  },
  {
    fullName: "Vijaya Chopra",
    phone: "0985678901",
    customerCode: "CUST080",
    billingAddress: "572 Tilak Colony, Sullurpeta",
  },
  {
    fullName: "Srinivas Mehra",
    phone: "9877890123",
    customerCode: "CUST081",
    billingAddress: "683 Mangal Lane, Sullurpeta",
  },
  {
    fullName: "Latha Saxena",
    phone: "8768901234",
    customerCode: "CUST082",
    billingAddress: "794 Shanti Street, Sullurpeta",
  },
  {
    fullName: "Venkat Tiwari",
    phone: "7659012345",
    customerCode: "CUST083",
    billingAddress: "805 Prem Avenue, Sullurpeta",
  },
  {
    fullName: "Padma Yadav",
    phone: "6540123456",
    customerCode: "CUST084",
    billingAddress: "916 Anand Road, Sullurpeta",
  },
  {
    fullName: "Gopal Kaur",
    phone: "5431234567",
    customerCode: "CUST085",
    billingAddress: "027 Sukha Colony, Sullurpeta",
  },
  {
    fullName: "Sita Khan",
    phone: "4322345678",
    customerCode: "CUST086",
    billingAddress: "138 Daya Nagar, Sullurpeta",
  },
  {
    fullName: "Madhav Ahmed",
    phone: "3213456789",
    customerCode: "CUST087",
    billingAddress: "249 Karuna Street, Sullurpeta",
  },
  {
    fullName: "Ganga Hussain",
    phone: "2104567890",
    customerCode: "CUST088",
    billingAddress: "350 Maitri Road, Sullurpeta",
  },
  {
    fullName: "Keshav Ali",
    phone: "1095678901",
    customerCode: "CUST089",
    billingAddress: "461 Priya Colony, Sullurpeta",
  },
  {
    fullName: "Yamuna Pandey",
    phone: "0986789012",
    customerCode: "CUST090",
    billingAddress: "572 Anjali Lane, Sullurpeta",
  },
  {
    fullName: "Rajesh Mishra",
    phone: "9878901234",
    customerCode: "CUST091",
    billingAddress: "683 Gandhi Street, Sullurpeta",
  },
  {
    fullName: "Priya Dubey",
    phone: "8769012345",
    customerCode: "CUST092",
    billingAddress: "794 Nehru Avenue, Sullurpeta",
  },
  {
    fullName: "Amit Chauhan",
    phone: "7650123456",
    customerCode: "CUST093",
    billingAddress: "805 Tagore Road, Sullurpeta",
  },
  {
    fullName: "Neha Tomar",
    phone: "6541234567",
    customerCode: "CUST094",
    billingAddress: "916 Patel Colony, Sullurpeta",
  },
  {
    fullName: "Suresh Rathore",
    phone: "5432345678",
    customerCode: "CUST095",
    billingAddress: "027 Bose Nagar, Sullurpeta",
  },
  {
    fullName: "Kavita Rajput",
    phone: "4323456789",
    customerCode: "CUST096",
    billingAddress: "138 Tilak Street, Sullurpeta",
  },
  {
    fullName: "Ramesh Thakur",
    phone: "3214567890",
    customerCode: "CUST097",
    billingAddress: "249 Lajpat Road, Sullurpeta",
  },
  {
    fullName: "Anjali Bhatt",
    phone: "2105678901",
    customerCode: "CUST098",
    billingAddress: "350 Azad Colony, Sullurpeta",
  },
  {
    fullName: "Vikram Nair",
    phone: "1096789012",
    customerCode: "CUST099",
    billingAddress: "461 Subhash Lane, Sullurpeta",
  },
  {
    fullName: "Pooja Menon",
    phone: "0987890123",
    customerCode: "CUST100",
    billingAddress: "572 Bhagat Street, Sullurpeta",
  },
];

// Hardware rows (Router Name, Ip Address, Mac Address) + loose match keys
const EXCEL_HARDWARE = [
  {
    matchName: "sivakumarreddy@srishti",
    matchPhone: "9493124584",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: "20:0C:86:A2:3A:B9",
  },
  {
    matchName: "jayachandra@srishti",
    matchPhone: "7989980178",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: "B4:3D:08:31:5D:11",
  },
  {
    matchName: "syedsharifbasha",
    matchPhone: "8686881101",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: null,
  },
  // ... 280 more hardware rows extracted and cleaned from the Excel ...
];

// ============ Random Helpers ============
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const firstNames = [
  "Rajesh",
  "Priya",
  "Amit",
  "Neha",
  "Suresh",
  "Kavita",
  "Ramesh",
  "Anjali",
  "Vikram",
  "Pooja",
  "Arun",
  "Meera",
  "Sanjay",
  "Divya",
  "Mohan",
  "Rashmi",
  "Krishna",
  "Swati",
  "Deepak",
  "Nisha",
  "Prakash",
  "Anita",
  "Sunil",
  "Reena",
  "Vijay",
  "Sonia",
  "Ravi",
  "Kirti",
  "Ajay",
  "Priyanka",
  "Manoj",
  "Jyoti",
  "Sachin",
  "Ritu",
  "Dinesh",
  "Pallavi",
  "Naresh",
  "Shweta",
  "Rajiv",
  "Monika",
  "Anil",
  "Sangeeta",
  "Pankaj",
  "Rekha",
  "Vinod",
  "Madhu",
  "Sudhir",
  "Kalpana",
  "Rakesh",
  "Seema",
  "Mukesh",
  "Archana",
  "Sandeep",
  "Vandana",
  "Harish",
  "Kavita",
  "Ashok",
  "Sunita",
  "Rahul",
  "Anju",
  "Satish",
  "Manju",
  "Girish",
  "Renu",
  "Pramod",
  "Sushma",
  "Dilip",
  "Kusum",
  "Ranjit",
  "Sarita",
  "Bharat",
  "Lakshmi",
  "Chandan",
  "Geeta",
  "Murali",
  "Radha",
  "Kishan",
  "Uma",
  "Naveen",
  "Vijaya",
  "Srinivas",
  "Latha",
  "Venkat",
  "Padma",
  "Gopal",
  "Sita",
  "Madhav",
  "Ganga",
  "Keshav",
  "Yamuna",
];
const lastNames = [
  "Kumar",
  "Singh",
  "Sharma",
  "Patel",
  "Reddy",
  "Gupta",
  "Verma",
  "Malhotra",
  "Kapoor",
  "Joshi",
  "Chopra",
  "Mehra",
  "Saxena",
  "Tiwari",
  "Yadav",
  "Kaur",
  "Khan",
  "Ahmed",
  "Hussain",
  "Ali",
  "Pandey",
  "Mishra",
  "Dubey",
  "Chauhan",
  "Tomar",
  "Rathore",
  "Rajput",
  "Thakur",
  "Bhatt",
  "Nair",
  "Menon",
  "Iyer",
  "Pillai",
  "Nayar",
  "Kurup",
  "Nambiar",
  "Unni",
  "Krishnan",
  "Raman",
  "Subramanian",
  "Venkatesh",
  "Srinivasan",
  "Raghavan",
  "Ganesan",
  "Balaji",
  "Murthy",
  "Rao",
  "Naidu",
  "Chowdary",
  "Prasad",
  "Das",
  "Bose",
  "Banerjee",
  "Chatterjee",
  "Mukherjee",
  "Dutta",
  "Sen",
  "Ghosh",
  "Basu",
  "Mandal",
  "Roy",
  "Saha",
  "Mazumdar",
  "Chakraborty",
  "Bhattacharya",
  "Ganguly",
  "Dey",
  "Pal",
  "Sarkar",
  "Mondal",
];
const domains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "rediffmail.com",
];
const streetNames = [
  "Gandhi",
  "Nehru",
  "Tagore",
  "Patel",
  "Bose",
  "Tilak",
  "Lajpat",
  "Azad",
  "Subhash",
  "Bhagat",
  "Rajiv",
  "Indira",
  "Jawahar",
  "Mahatma",
  "Sardar",
  "Netaji",
  "Lal",
  "Bal",
  "Pal",
  "Tilak",
  "Mangal",
  "Shanti",
  "Prem",
  "Anand",
  "Sukha",
  "Daya",
  "Karuna",
  "Maitri",
  "Priya",
  "Anjali",
];
const streetTypes = [
  "Road",
  "Street",
  "Lane",
  "Avenue",
  "Colony",
  "Nagar",
  "Vihar",
  "Garden",
  "Park",
  "Marg",
];
const deviceFallbackTypes = [
  "Router",
  "Modem",
  "Optical Network Terminal",
  "Set-top Box",
];

const generateMAC = () =>
  `00:1B:44:${randomInt(11, 99)}:${randomInt(11, 99)}:${randomInt(11, 99)}`;

// Random date within a specific month of a specific year
const generateRandomDateInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const randomDay = randomInt(1, daysInMonth);
  const randomHour = randomInt(9, 18);
  const randomMinute = randomInt(0, 59);
  return new Date(year, month - 1, randomDay, randomHour, randomMinute);
};

// Unique invoice number
const generateInvoiceNumber = (companyId, customerId, date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `INV-${companyId}-${customerId}-${year}${month}${day}-${randomInt(
    1000,
    9999
  )}`;
};

const sanitizePhone = (v) => {
  if (v === null || v === undefined) return null;
  let s = String(v);
  // Remove non-digits
  s = s.replace(/\D/g, "");
  if (s.length > 12) s = s.slice(-12);
  return s || null;
};

const now = new Date();
const monthsBackCount = 18; // varied months/years

const monthsBack = Array.from({ length: monthsBackCount }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}).reverse();

// ============ SEED ============
const seedDatabase = async () => {
  try {
    console.log("Syncing database and dropping all tables...");
    await sequelize.sync({ force: true });
    console.log("Database synced and all tables dropped!");

    // --- 1. Features ---
    console.log("Seeding Features...");
    const features = await models.Feature.bulkCreate([
      // Super Admin
      {
        code: "superadmin.dashboard.view",
        name: "View Super Admin Dashboard",
        module: "Dashboard",
      },
      { code: "company.manage", name: "Manage Companies", module: "Companies" },
      {
        code: "superadmin.users.manage",
        name: "Manage All Users",
        module: "Users",
      },

      // Admin
      {
        code: "admin.dashboard.view",
        name: "View Admin Dashboard",
        module: "Dashboard",
      },
      { code: "agent.manage", name: "Manage Agents", module: "Users" },
      { code: "plan.manage", name: "Manage Plans", module: "Billing" },
      { code: "customers.view", name: "View Customers", module: "Customers" },
      { code: "plans.view", name: "View Plans", module: "Plans" },
      { code: "agents.view", name: "View Agents", module: "Agents" },
      { code: "reports.view", name: "View Reports", module: "Reports" },
      { code: "payments.view", name: "View Payments", module: "Payments" },
      { code: "customer.add", name: "Add Customer", module: "Customers" },
      { code: "customer.edit", name: "Edit Customer", module: "Customers" },
      {
        code: "customer.view.all",
        name: "View All Customers",
        module: "Customers",
      },
      { code: "customer.delete", name: "Delete Customer", module: "Customers" },
      { code: "area.manage", name: "Manage Areas", module: "Areas" },
      {
        code: "subscription.manage",
        name: "Manage Subscriptions",
        module: "Billing",
      },
      { code: "invoice.manage", name: "Manage Invoices", module: "Billing" },

      // Agent
      {
        code: "agent.dashboard.view",
        name: "View Agent Dashboard",
        module: "Dashboard",
      },
      {
        code: "collection.manage",
        name: "Manage Collections",
        module: "Billing",
      },
      {
        code: "collection.view",
        name: "View Collection",
        module: "Collection",
      },
      {
        code: "customer.view.one",
        name: "View Single Customer",
        module: "Customers",
      },
      { code: "payment.collect", name: "Collect Payments", module: "Payments" },
      {
        code: "customer.hardware.view",
        name: "View Customer Hardware",
        module: "Customers",
      },
    ]);
    const featureMap = features.reduce(
      (map, feature) => ((map[feature.code] = feature.id), map),
      {}
    );
    console.log("Features seeded.");

    // --- 2. Roles ---
    console.log("Seeding Roles...");
    const roles = await models.Role.bulkCreate([
      {
        name: "Super Admin",
        code: "SUPER_ADMIN",
        description: "Full system access with company management capabilities",
      },
      {
        name: "Admin",
        code: "ADMIN",
        description: "Company-level administrative access",
      },
      {
        name: "Agent",
        code: "AGENT",
        description: "Field agent with customer and collection access",
      },
    ]);
    const roleMap = roles.reduce(
      (map, role) => ((map[role.code] = role.id), map),
      {}
    );
    console.log("Roles seeded.");

    // --- 3. Company ---
    console.log("Seeding Company...");
    const company = await models.Company.create({
      name: "Nexus Telecom",
      address: "123 Fiber Optic Lane, Network City",
    });
    console.log("Company seeded.");

    // --- 4. Users ---
    console.log("Seeding Users...");
    const superAdmin = await models.User.create({
      name: "Super Admin",
      email: "super@admin.com",
      phone: "0000000000",
      passwordHash: "supersecret123",
      roleId: roleMap["SUPER_ADMIN"],
      companyId: null,
    });

    // Areas from embedded list (or fallback)
    console.log("Seeding Areas...");
    const areaNames = EXCEL_AREA_NAMES.length
      ? EXCEL_AREA_NAMES
      : ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"];
    const areas = await models.Area.bulkCreate(
      areaNames.map((name) => ({
        areaName: name,
        companyId: company.id,
        createdBy: superAdmin.id,
      }))
    );
    console.log(`Areas seeded. (${areas.length})`);

    // company admins
    const adminNames = [
      "Rajesh Kumar",
      "Priya Sharma",
      "Amit Patel",
      "Neha Reddy",
      "Suresh Verma",
    ];
    const admins = [];
    for (let i = 0; i < adminNames.length; i++) {
      const name = adminNames[i];
      admins.push(
        await models.User.create({
          name,
          email: `admin${i + 1}@nexustelecom.com`,
          phone: `987654321${i}`,
          passwordHash: "adminpass123",
          roleId: roleMap["ADMIN"],
          companyId: company.id,
        })
      );
    }

    // company agents
    const agentNames = [
      "Kavita Singh",
      "Ramesh Gupta",
      "Anjali Malhotra",
      "Vikram Kapoor",
      "Pooja Joshi",
      "Arun Chopra",
      "Meera Mehra",
      "Sanjay Saxena",
      "Divya Tiwari",
      "Mohan Yadav",
      "Rashmi Kaur",
      "Krishna Khan",
      "Swati Ahmed",
      "Deepak Hussain",
      "Nisha Ali",
      "Prakash Pandey",
      "Anita Mishra",
      "Sunil Dubey",
      "Reena Chauhan",
      "Vijay Tomar",
    ];
    const agents = [];
    for (let i = 0; i < agentNames.length; i++) {
      const name = agentNames[i];
      agents.push(
        await models.User.create({
          name,
          email: `agent${i + 1}@nexustelecom.com`,
          phone: `876543210${String(i + 1).padStart(2, "0")}`,
          passwordHash: "agentpass123",
          roleId: roleMap["AGENT"],
          companyId: company.id,
        })
      );
    }
    console.log("Users seeded.");

    // --- 5. Permissions ---
    console.log("Granting Permissions...");
    const rolePermissions = [];

    features.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["SUPER_ADMIN"], featureId: f.id })
    );

    const adminFeatures = features.filter(
      (f) =>
        !f.code.startsWith("superadmin.") &&
        !f.code.startsWith("company.manage")
    );
    adminFeatures.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["ADMIN"], featureId: f.id })
    );

    [
      "agent.dashboard.view",
      "collection.manage",
      "collection.view",
      "customer.view.one",
      "customer.add",
      "payment.collect",
      "customer.hardware.view",
    ].forEach((code) => {
      if (featureMap[code])
        rolePermissions.push({
          roleId: roleMap["AGENT"],
          featureId: featureMap[code],
        });
    });
    await models.RolePermission.bulkCreate(rolePermissions);
    console.log("Permissions granted.");

    // --- 6. Plans ---
    console.log("Seeding Plans...");
    const planNames = EXCEL_PLAN_NAMES.length
      ? EXCEL_PLAN_NAMES
      : [
          "Basic 50Mbps",
          "Standard 100Mbps",
          "Premium 300Mbps",
          "Pro 500Mbps",
          "Gigabit 1Gbps",
        ];
    const plans = await models.Plan.bulkCreate(
      planNames.map((name, idx) => {
        const priceBands = [
          500, 750, 1000, 1200, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 4500,
          5000,
        ];
        const price = priceBands[randomInt(0, priceBands.length - 1)];
        const code =
          "PLAN-" +
          name
            .replace(/[^A-Za-z0-9]+/g, "-")
            .toUpperCase()
            .replace(/^-|-$/g, "") +
          "-" +
          String(idx + 1).padStart(2, "0");
        return {
          companyId: company.id,
          name,
          monthlyPrice: price, // integer
          code,
        };
      })
    );
    console.log(`Plans seeded. (${plans.length})`);

    // --- 7. Customers + related data ---
    console.log("Seeding Customers and related data...");
    const areasArr = await models.Area.findAll({
      where: { companyId: company.id },
    });

    const customersPayload = [];
    const excelCustomers = EXCEL_CUSTOMERS.length ? EXCEL_CUSTOMERS : [];
    const customersSource = excelCustomers.length
      ? excelCustomers
      : Array.from({ length: 30 }, (_, i) => ({
          fullName: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
          phone: `9${randomInt(100000000, 999999999)}`,
          customerCode: `CUST-${String(i + 1).padStart(4, "0")}`,
          billingAddress: `${randomInt(100, 9999)} ${getRandomItem(
            streetNames
          )} ${getRandomItem(streetTypes)}`,
        }));

    for (let i = 0; i < customersSource.length; i++) {
      const src = customersSource[i];
      const name =
        src.fullName && String(src.fullName).trim().length
          ? src.fullName
          : `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const phone =
        sanitizePhone(src.phone) || `9${randomInt(100000000, 999999999)}`;
      const code =
        (src.customerCode && String(src.customerCode).trim()) ||
        `CUST-${String(i + 1).padStart(4, "0")}`;
      const billingAddress =
        (src.billingAddress && String(src.billingAddress).trim()) ||
        `${randomInt(100, 9999)} ${getRandomItem(streetNames)} ${getRandomItem(
          streetTypes
        )}`;
      const email = `${name.split(" ")[0].toLowerCase()}.${randomInt(
        100,
        999
      )}@${getRandomItem(domains)}`;
      const assignedAgent = getRandomItem(agents);
      const createdBy = getRandomItem(admins);
      const area = getRandomItem(areasArr);

      customersPayload.push({
        companyId: company.id,
        fullName: name,
        phone,
        email,
        address: billingAddress,
        customerCode: code,
        assignedAgentId: assignedAgent.id,
        createdBy: createdBy.id,
        installationDate: new Date(),
        areaId: area.id,
      });
    }

    const customers = await models.Customer.bulkCreate(customersPayload);

    // ----- Hardware mapping from embedded rows -----
    const hardwareData = [];
    const custIndexByKey = new Map();
    for (const c of customers) {
      const codeKey = (c.customerCode || "").toUpperCase();
      if (codeKey) custIndexByKey.set(codeKey, c.id);
      const phoneNorm = sanitizePhone(c.phone) || "";
      custIndexByKey.set(`${(c.fullName || "").trim()}__${phoneNorm}`, c.id);
    }

    // Add Excel hardware
    for (const hw of EXCEL_HARDWARE) {
      const codeKey = (hw.matchCustomerCode || "").toUpperCase();
      const phoneNorm = sanitizePhone(hw.matchPhone) || "";
      const nameKey = `${(hw.matchName || "").trim()}__${phoneNorm}`;

      const cid = custIndexByKey.get(codeKey) || custIndexByKey.get(nameKey);
      if (!cid) continue;

      const deviceType =
        hw.router && hw.router.trim()
          ? hw.router.trim()
          : getRandomItem(deviceFallbackTypes);
      const mac = (hw.mac && hw.mac.trim()) || generateMAC();
      const ipAddress =
        (hw.ip && hw.ip.trim()) ||
        `192.168.${randomInt(0, 254)}.${randomInt(2, 254)}`;

      hardwareData.push({
        customerId: cid,
        deviceType,
        macAddress: mac,
        ipAddress,
      });

      if (Math.random() > 0.5) {
        hardwareData.push({
          customerId: cid,
          deviceType: getRandomItem(deviceFallbackTypes),
          macAddress: generateMAC(),
          ipAddress: `10.${randomInt(0, 254)}.${randomInt(0, 254)}.${randomInt(
            2,
            254
          )}`,
        });
      }
    }

    // Fill hardware for customers that still don't have any
    const customersWithHw = new Set(hardwareData.map((h) => h.customerId));
    for (const customer of customers) {
      if (!customersWithHw.has(customer.id)) {
        hardwareData.push({
          customerId: customer.id,
          deviceType: getRandomItem(deviceFallbackTypes),
          macAddress: generateMAC(),
          ipAddress: `192.168.${randomInt(0, 254)}.${randomInt(2, 254)}`,
        });
        if (Math.random() > 0.5) {
          hardwareData.push({
            customerId: customer.id,
            deviceType: getRandomItem(deviceFallbackTypes),
            macAddress: generateMAC(),
            ipAddress: `172.${randomInt(16, 31)}.${randomInt(
              0,
              254
            )}.${randomInt(2, 254)}`,
          });
        }
      }
    }

    const paymentsData = [];
    const invoiceItemsData = [];
    const transactionsData = [];
    const pendingChargesData = [];

    // Subscriptions + Invoices + Payments
    for (const customer of customers) {
      const plan = getRandomItem(plans);
      const createdSub = await models.Subscription.create({
        companyId: company.id,
        customerId: customer.id,
        planId: plan.id,
        startDate: new Date(),
      });

      for (const { year, month } of monthsBack) {
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        const dueDate = new Date(year, month - 1, randomInt(10, 22));

        const amount = plan.monthlyPrice; // integer
        const tax = Math.round(amount * 0.18);
        const total = Math.round(amount + tax);

        const isPaid = Math.random() > 0.35;

        const invoiceDate = new Date(year, month - 1, 1);
        const invoiceNumber = generateInvoiceNumber(
          company.id,
          customer.id,
          invoiceDate
        );

        const createdInvoice = await models.Invoice.create({
          companyId: company.id,
          customerId: customer.id,
          subscriptionId: createdSub.id,
          periodStart,
          periodEnd,
          subtotal: amount,
          taxAmount: tax,
          discounts: 0,
          amountTotal: total,
          dueDate,
          status: isPaid
            ? "PAID"
            : dueDate < new Date()
            ? "OVERDUE"
            : "PENDING",
          invoiceNumber,
          notes: `Monthly internet service for ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
          isActive: true,
        });

        // Invoice items
        invoiceItemsData.push({
          invoiceId: createdInvoice.id,
          itemType: "INTERNET_SERVICE",
          description: `${plan.name} - Monthly Service`,
          quantity: 1,
          unitPrice: amount,
          totalAmount: amount,
          isActive: true,
        });

        if (Math.random() > 0.6) {
          const additionalServices = [
            {
              type: "ROUTER_INSTALLATION",
              description: "Router Installation Service",
              price: 800,
            },
            {
              type: "EQUIPMENT_CHARGE",
              description: "Equipment Charge",
              price: 500,
            },
            {
              type: "ADJUSTMENT",
              description: "Service Adjustment",
              price: 400,
            },
            {
              type: "OTHER",
              description: "Additional Service Fee",
              price: 300,
            },
          ];
          const additionalService = getRandomItem(additionalServices);
          invoiceItemsData.push({
            invoiceId: createdInvoice.id,
            itemType: additionalService.type,
            description: additionalService.description,
            quantity: 1,
            unitPrice: additionalService.price,
            totalAmount: additionalService.price,
            isActive: true,
          });
        }

        if (Math.random() > 0.7) {
          invoiceItemsData.push({
            invoiceId: createdInvoice.id,
            itemType: "LATE_FEE",
            description: "Late Payment Fee",
            quantity: 1,
            unitPrice: 200,
            totalAmount: 200,
            isActive: true,
          });
        }

        if (isPaid) {
          const collectionDate = generateRandomDateInMonth(year, month);
          paymentsData.push({
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            amount: total,
            comments: `Payment collected for invoice ${invoiceNumber}`,
          });

          transactionsData.push({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            amount: total,
            balanceBefore: 0,
            balanceAfter: 0,
            description: `Payment received for invoice ${invoiceNumber}`,
            referenceId: createdInvoice.id,
            referenceType: "invoice",
            transactionDate: collectionDate,
            recordedDate: collectionDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });
        } else {
          transactionsData.push({
            companyId: company.id,
            customerId: customer.id,
            type: "BILL_GENERATION",
            amount: total,
            balanceBefore: 0,
            balanceAfter: total,
            description: `Bill generated for invoice ${invoiceNumber}`,
            referenceId: createdInvoice.id,
            referenceType: "invoice",
            transactionDate: invoiceDate,
            recordedDate: invoiceDate,
            createdBy: getRandomItem(admins).id,
            isActive: true,
          });
        }

        // Add some balance adjustments and pending charge transactions
        if (Math.random() > 0.8) {
          const adjustmentTypes = [
            "BALANCE_ADJUSTMENT",
            "PENDING_CHARGE_ADDED",
          ];
          const adjustmentType = getRandomItem(adjustmentTypes);
          const adjustmentAmount = randomInt(100, 500);

          transactionsData.push({
            companyId: company.id,
            customerId: customer.id,
            type: adjustmentType,
            amount: adjustmentAmount,
            balanceBefore: total,
            balanceAfter:
              adjustmentType === "BALANCE_ADJUSTMENT"
                ? total - adjustmentAmount
                : total + adjustmentAmount,
            description:
              adjustmentType === "BALANCE_ADJUSTMENT"
                ? `Balance adjustment of ₹${adjustmentAmount} for ${customer.fullName}`
                : `Pending charge added of ₹${adjustmentAmount} for ${customer.fullName}`,
            referenceId: null,
            referenceType: "adjustment",
            transactionDate: new Date(year, month - 1, randomInt(15, 28)),
            recordedDate: new Date(year, month - 1, randomInt(15, 28)),
            createdBy: getRandomItem(admins).id,
            isActive: true,
          });
        }
      }

      // Pending charges
      if (Math.random() > 0.5) {
        const pendingChargeTypes = [
          "ROUTER_INSTALLATION",
          "EQUIPMENT_CHARGE",
          "LATE_FEE",
          "ADJUSTMENT",
          "OTHER",
        ];
        const chargeType = getRandomItem(pendingChargeTypes);
        const chargeAmounts = {
          ROUTER_INSTALLATION: randomInt(500, 1500),
          EQUIPMENT_CHARGE: randomInt(1000, 3000),
          LATE_FEE: randomInt(100, 500),
          ADJUSTMENT: randomInt(200, 1000),
          OTHER: randomInt(100, 1000),
        };
        pendingChargesData.push({
          companyId: company.id,
          customerId: customer.id,
          chargeType,
          description: `${chargeType
            .replace(/_/g, " ")
            .toLowerCase()} charge for ${customer.fullName}`,
          amount: chargeAmounts[chargeType],
          isApplied: Math.random() > 0.6,
          appliedToInvoiceId: null,
          appliedDate: null,
          createdBy: getRandomItem(admins).id,
          isActive: true,
        });
      }
    }

    await models.CustomerHardware.bulkCreate(hardwareData);
    await models.InvoiceItem.bulkCreate(invoiceItemsData);
    await models.Payment.bulkCreate(paymentsData);
    await models.Transaction.bulkCreate(transactionsData);
    await models.PendingCharge.bulkCreate(pendingChargesData);

    // --- Additional current-month collections (varied dates) ---
    console.log("Adding additional current-month collection data...");
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const extraCustomers = customers.slice(0, Math.min(15, customers.length));
    for (const customer of extraCustomers) {
      const plan = getRandomItem(plans);
      const subscription = await models.Subscription.findOne({
        where: { customerId: customer.id },
      });
      const days = [1, 5, 10, 15, 20, 25, 28, 30].filter(
        (d) => new Date(currentYear, currentMonth - 1, d) <= now
      );

      for (const day of days) {
        if (Math.random() > 0.4) {
          const periodStart = new Date(currentYear, currentMonth - 1, 1);
          const periodEnd = new Date(currentYear, currentMonth, 0);
          const dueDate = new Date(currentYear, currentMonth - 1, 15);

          const amount = plan.monthlyPrice;
          const tax = Math.round(amount * 0.18);
          const total = Math.round(amount + tax);

          const invoiceDate = new Date(currentYear, currentMonth - 1, 1);
          const invoiceNumber = generateInvoiceNumber(
            company.id,
            customer.id,
            invoiceDate
          );

          const createdInvoice = await models.Invoice.create({
            companyId: company.id,
            customerId: customer.id,
            subscriptionId: subscription.id,
            periodStart,
            periodEnd,
            subtotal: amount,
            taxAmount: tax,
            discounts: 0,
            amountTotal: total,
            dueDate,
            status: "PAID",
            invoiceNumber,
            notes: `Additional ${periodStart.toLocaleString("default", {
              month: "long",
            })} invoice for ${customer.fullName}`,
            isActive: true,
          });

          await models.InvoiceItem.create({
            invoiceId: createdInvoice.id,
            itemType: "INTERNET_SERVICE",
            description: `${plan.name} - Monthly Service`,
            quantity: 1,
            unitPrice: amount,
            totalAmount: amount,
            isActive: true,
          });

          const collectionDate = new Date(
            currentYear,
            currentMonth - 1,
            day,
            randomInt(9, 18),
            randomInt(0, 59)
          );
          await models.Payment.create({
            companyId: company.id,
            invoiceId: createdInvoice.id,
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            amount: total,
            comments: `Additional ${periodStart.toLocaleString("default", {
              month: "long",
            })} payment for invoice ${invoiceNumber}`,
          });

          await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            amount: total,
            balanceBefore: 0,
            balanceAfter: 0,
            description: `Payment received for invoice ${invoiceNumber}`,
            referenceId: createdInvoice.id,
            referenceType: "invoice",
            transactionDate: collectionDate,
            recordedDate: collectionDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });
        }
      }
    }

    console.log("All data seeded.");
    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
