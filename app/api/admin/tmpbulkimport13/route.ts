import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-bulkimport13-7d2f91ac-2026-09-30';

const NEW_CLIENTS = [
  {
    "id": "CLI-201",
    "clientName": "Storable India Private Limited",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "On Going"
  },
  {
    "id": "CLI-202",
    "clientName": "KIBO Commerce Software Private Limited",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "On Going"
  },
  {
    "id": "CLI-203",
    "clientName": "Webyog Softworks Private Limited",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Operating/Insolvency",
    "auditClosure": "On Going"
  },
  {
    "id": "CLI-204",
    "clientName": "Skydo Technologies Private Ltd",
    "manager": "Srikrishna",
    "teamMember": "Harinath Reddy",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "On Going"
  },
  {
    "id": "CLI-205",
    "clientName": "Khoros India R & D Private Limited",
    "manager": "Srikrishna",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Pending"
  },
  {
    "id": "CLI-206",
    "clientName": "Quark R&D",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "On Going"
  },
  {
    "id": "CLI-207",
    "clientName": "Quark Software",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Pending"
  },
  {
    "id": "CLI-208",
    "clientName": "Xyne",
    "manager": "Srikrishna",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "Operating/Closure",
    "auditClosure": "Pending"
  },
  {
    "id": "CLI-209",
    "clientName": "Nimzo",
    "manager": "Srikrishna",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "Pending"
  },
  {
    "id": "CLI-210",
    "clientName": "Cloud Sense",
    "manager": "Srikrishna",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "Pending"
  },
  {
    "id": "CLI-211",
    "clientName": "Konekt Marketing Systems Pvt Ltd",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "NA"
  },
  {
    "id": "CLI-212",
    "clientName": "SLE Technology Consulting India Pvt Ltd",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "NA"
  },
  {
    "id": "CLI-213",
    "clientName": "ResponseTek (India) Pvt Ltd",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "NA"
  },
  {
    "id": "CLI-214",
    "clientName": "Trilogy E-Business Software India Pvt Ltd",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "On Going"
  },
  {
    "id": "CLI-215",
    "clientName": "Kshipra",
    "manager": "Srikrishna",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Non Operating",
    "auditClosure": "Pending"
  },
  {
    "id": "CLI-216",
    "clientName": "Searchlight Health Pvt Ltd",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Signature pending"
  },
  {
    "id": "CLI-217",
    "clientName": "Lexconnect Consulting Pvt Ltd",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Audit in process"
  },
  {
    "id": "CLI-218",
    "clientName": "Virya Mobility 5.0 LLP",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "High",
    "status": "Accounting & Compliances",
    "auditClosure": "Signature pending"
  },
  {
    "id": "CLI-219",
    "clientName": "Virya Autonomous Technologies Pvt Ltd",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "High",
    "status": "Accounting & Compliances",
    "auditClosure": "Signature pending"
  },
  {
    "id": "CLI-220",
    "clientName": "Maini Rental Solutions LLP",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "High",
    "status": "Accounting & Compliances",
    "auditClosure": "Signature pending"
  },
  {
    "id": "CLI-221",
    "clientName": "Vora Reality LLP",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "High",
    "status": "Accounting & Compliances",
    "auditClosure": "Audit in process"
  },
  {
    "id": "CLI-222",
    "clientName": "Cyma Investments Pvt Ltd",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Director review pending"
  },
  {
    "id": "CLI-223",
    "clientName": "Phobos Developments Pvt Ltd",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Signature pending"
  },
  {
    "id": "CLI-224",
    "clientName": "Titania Business LLP",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Signature pending"
  },
  {
    "id": "CLI-225",
    "clientName": "Arnov Business Solutions Pvt Ltd",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "Low",
    "status": "Accounting & Compliances",
    "auditClosure": "Audit in process"
  },
  {
    "id": "CLI-226",
    "clientName": "OYL India LLP",
    "manager": "Rajesh",
    "teamMember": "Shivaprasad",
    "priority": "High",
    "status": "Accounting & Compliances",
    "auditClosure": "Books ready to share for audit"
  },
  {
    "id": "CLI-227",
    "clientName": "Indusage Capital Managers LLP",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "EY - Will start by 15th July"
  },
  {
    "id": "CLI-228",
    "clientName": "Indusage Management Services Pvt Ltd",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Under progress"
  },
  {
    "id": "CLI-229",
    "clientName": "Indusage Advisors Limited",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Minimum",
    "auditClosure": "Under progress"
  },
  {
    "id": "CLI-230",
    "clientName": "Indusage Partners",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Minimum",
    "auditClosure": "EY"
  },
  {
    "id": "CLI-231",
    "clientName": "Indusage Technology Venture Fund I",
    "manager": "Manju",
    "teamMember": "Entrust",
    "priority": "Medium",
    "status": "Compliance GST & TDS",
    "auditClosure": "Will close by this week"
  },
  {
    "id": "CLI-232",
    "clientName": "Indusage Global Technology Venture Fund II",
    "manager": "Manju",
    "teamMember": "Entrust",
    "priority": "Medium",
    "status": "Compliance GST & TDS",
    "auditClosure": "Will close by this week"
  },
  {
    "id": "CLI-233",
    "clientName": "Indusage Seed Capital LLP",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Minimum",
    "auditClosure": "Ready for DK's Audit review"
  },
  {
    "id": "CLI-234",
    "clientName": "Sudhir Rao",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Yet to start"
  },
  {
    "id": "CLI-235",
    "clientName": "Celesta India AIF Managers LLP",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Accounting & Compliances",
    "auditClosure": "Confirmation received, audit not applicable, filing will be done by PDKA"
  },
  {
    "id": "CLI-236",
    "clientName": "Artlink Learnings Pvt Ltd",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Minimum",
    "auditClosure": "Ready for DK's Audit review"
  },
  {
    "id": "CLI-237",
    "clientName": "Music Univ India Private Limited",
    "manager": "Manju",
    "teamMember": "Uma Maheshwar",
    "priority": "Medium",
    "status": "Minimum",
    "auditClosure": "Ready for DK's Audit review"
  },
  {
    "id": "CLI-238",
    "clientName": "Myyoga Teacher India Private Limited",
    "manager": "Manju",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Will be given by 15th of this month"
  },
  {
    "id": "CLI-239",
    "clientName": "India Seed Ventures Private Limited",
    "manager": "Manju",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": ""
  },
  {
    "id": "CLI-240",
    "clientName": "Innovation Scaleup Private Limited",
    "manager": "Manju",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Audit pending for bills, will share books for audit once bills received"
  },
  {
    "id": "CLI-241",
    "clientName": "Zencomply Technologies Private Limited",
    "manager": "Manju",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": ""
  },
  {
    "id": "CLI-242",
    "clientName": "Gridix E Software Private Limited",
    "manager": "Manju",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": ""
  },
  {
    "id": "CLI-243",
    "clientName": "Procurement Advisors Pvt Ltd",
    "manager": "Kavya",
    "teamMember": "Rani",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Books shared for audit"
  },
  {
    "id": "CLI-244",
    "clientName": "Beskar Technologies",
    "manager": "Kavya",
    "teamMember": "Rani",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Pending credit card statements and few bills from client"
  },
  {
    "id": "CLI-245",
    "clientName": "Secondlayer Technology India Pvt Ltd",
    "manager": "Kavya",
    "teamMember": "Rani",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Books shared for audit"
  },
  {
    "id": "CLI-246",
    "clientName": "SS Creative",
    "manager": "Kavya",
    "teamMember": "Rani",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Done"
  },
  {
    "id": "CLI-247",
    "clientName": "Bluntedge Pte",
    "manager": "Kavya",
    "teamMember": "Rani",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Done"
  },
  {
    "id": "CLI-248",
    "clientName": "Mundkur Law Partners",
    "manager": "Kavya",
    "teamMember": "Rani",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Yet to share the books for audit"
  },
  {
    "id": "CLI-249",
    "clientName": "Juspay Global Entities",
    "manager": "Kavya",
    "teamMember": "Kavya",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Done"
  },
  {
    "id": "CLI-250",
    "clientName": "Namma AI Labs",
    "manager": "Kavya",
    "teamMember": "Kavya",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Books shared for audit"
  },
  {
    "id": "CLI-251",
    "clientName": "Causeway Software Technologies India Private Limited",
    "manager": "Ramya",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "Ongoing"
  },
  {
    "id": "CLI-252",
    "clientName": "Crisis24 Solutions Private Limited",
    "manager": "Ramya",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "Ongoing"
  },
  {
    "id": "CLI-253",
    "clientName": "Inseego India Private Limited",
    "manager": "Ramya",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "Ongoing"
  },
  {
    "id": "CLI-254",
    "clientName": "Rize Agtech Private Limited",
    "manager": "Ramya",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "Completed, awaiting confirmation from client"
  },
  {
    "id": "CLI-255",
    "clientName": "Rize PTE Limited",
    "manager": "Ramya",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "Operating",
    "auditClosure": "Ongoing"
  },
  {
    "id": "CLI-256",
    "clientName": "Openi Partners LLP",
    "manager": "Ramya",
    "teamMember": "Vijay",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Ongoing"
  },
  {
    "id": "CLI-257",
    "clientName": "Consilio India Private Limited",
    "manager": "Ramya",
    "teamMember": "Ramya",
    "priority": "Low",
    "status": "STPI Returns",
    "auditClosure": "NA"
  },
  {
    "id": "CLI-258",
    "clientName": "Tekinroads Consulting LLP",
    "manager": "Ramya",
    "teamMember": "",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": ""
  },
  {
    "id": "CLI-259",
    "clientName": "Siana Capital Management LLP",
    "manager": "Ramya",
    "teamMember": "",
    "priority": "Medium",
    "status": "Operating",
    "auditClosure": "Ongoing"
  }
];

const NEW_TASKS = [
  {
    "id": "TSK-1014",
    "name": "Sales Data for 725 [Software Pvt Ltd]",
    "manager": "Srikrishna",
    "department": "Quark R&D",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1015",
    "name": "Dilip sir to be added as signatory in Bank",
    "manager": "Srikrishna",
    "department": "Quark R&D",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1016",
    "name": "Engagement Letter",
    "manager": "Srikrishna",
    "department": "Quark R&D",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1017",
    "name": "GST Refund Application",
    "manager": "Srikrishna",
    "department": "Quark R&D",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Rejected - Jul 23 to Mar 24",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1018",
    "name": "Change of Directors in GST",
    "manager": "Srikrishna",
    "department": "Storable India Private Limited",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "Done",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1019",
    "name": "IFC Audit",
    "manager": "Srikrishna",
    "department": "Storable India Private Limited",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Draft is done - to be finalised after Audit",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1020",
    "name": "Labour & POSH Compliance",
    "manager": "Srikrishna",
    "department": "KIBO Commerce Software Private Limited",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Labour Audit in progress",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1021",
    "name": "Payroll Restructuring",
    "manager": "Srikrishna",
    "department": "KIBO Commerce Software Private Limited",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Pending for Approval",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1022",
    "name": "Credit Card Application",
    "manager": "Srikrishna",
    "department": "KIBO Commerce Software Private Limited",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Corporate Credit Card",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1023",
    "name": "Remittance to be received for pending invoices",
    "manager": "Srikrishna",
    "department": "Webyog Softworks Private Limited",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Pending from May-24",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1024",
    "name": "Dividend Distribution",
    "manager": "Srikrishna",
    "department": "Khoros India R & D Private Limited",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "TRC pending",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1025",
    "name": "SPTI",
    "manager": "Srikrishna",
    "department": "Khoros India R & D Private Limited",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Exit",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1026",
    "name": "GST SEZ registration",
    "manager": "Srikrishna",
    "department": "Khoros India R & D Private Limited",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Exit",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1027",
    "name": "IT Notice",
    "manager": "Srikrishna",
    "department": "Khoros India R & D Private Limited",
    "teamMember": "Harinath Reddy",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Priority in source file was \"Very High\" -- app only supports High/Medium/Low, mapped to High.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1028",
    "name": "IDFC Bank",
    "manager": "Srikrishna",
    "department": "Skydo Technologies Private Ltd",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Check for Account verification facilities",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1029",
    "name": "Share Transfer",
    "manager": "Srikrishna",
    "department": "Xyne",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Share transfer in Xyne Inc",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1030",
    "name": "Gurav Khemchandani and Partners",
    "manager": "Srikrishna",
    "department": "Xyne",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1031",
    "name": "Payment to AVA",
    "manager": "Srikrishna",
    "department": "Xyne",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1032",
    "name": "NCLT Application",
    "manager": "Srikrishna",
    "department": "Nimzo",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "No withdrawal required",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1033",
    "name": "Dividend Account",
    "manager": "Srikrishna",
    "department": "Cloud Sense",
    "teamMember": "Harinath Reddy",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Account is created",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1034",
    "name": "Closure of PF registration",
    "manager": "Srikrishna",
    "department": "Konekt Marketing Systems Pvt Ltd",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Satish - Diligent HR Services from Pune is handling this",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1035",
    "name": "Income Tax Appeal and Penalty proceedings",
    "manager": "Srikrishna",
    "department": "Konekt Marketing Systems Pvt Ltd",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Hrithik - KPNB is handling this",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1036",
    "name": "Activating ICICI Bank account",
    "manager": "Srikrishna",
    "department": "ResponseTek (India) Pvt Ltd",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Update pending from Mohali Branch. Looking for fund transfer to ICICI Koramangala branch; signature required of previous signatories.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1037",
    "name": "PF arrears of ~\u20b948,000",
    "manager": "Srikrishna",
    "department": "ResponseTek (India) Pvt Ltd",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Dependant on Bank account activation",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1038",
    "name": "Income Tax Refund",
    "manager": "Srikrishna",
    "department": "Trilogy E-Business Software India Pvt Ltd",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1039",
    "name": "DPIIT Registration",
    "manager": "Srikrishna",
    "department": "Kshipra",
    "teamMember": "Shivam Kumar",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "In process",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1040",
    "name": "MEA Registration",
    "manager": "Srikrishna",
    "department": "Kshipra",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1041",
    "name": "India-USA Trade Facilitation Portal",
    "manager": "Srikrishna",
    "department": "Kshipra",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Hosted by Consulate General of India, New York",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1042",
    "name": "GST Registration",
    "manager": "Srikrishna",
    "department": "Kshipra",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "for Karnataka - in Process",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1043",
    "name": "ENET Facility",
    "manager": "Srikrishna",
    "department": "Kshipra",
    "teamMember": "Shivam Kumar",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "In process",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1044",
    "name": "Update to client on updated labour code",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "Mail sent and informed",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1045",
    "name": "Asset tagging recommendation",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "To ensure better control and tracking, asset tagging is recommended and list of assets with codes as per invoice are shared with client; client has to start with process",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1046",
    "name": "Restructuring wage component in payroll portal",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "Sent mail to client, need to update on portal",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1047",
    "name": "ESI applicability clarification",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Co. has employees below ESI limit as per amendment, so need to be informed on applicability -- clarity to be provided by DK",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1048",
    "name": "Projections for 409A valuation (MYT Inc)",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "Projections for 5 years and estimated financials for current year for MYT Inc for 409A valuation",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1049",
    "name": "Arranging documents for 409A valuation",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1050",
    "name": "ESI numbers to be created for employees",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "HR to complete the process",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1051",
    "name": "ESI portal issue",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Not able to create ESI numbers for employees due to portal issue, need to visit department",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1052",
    "name": "409A valuation pending",
    "manager": "Manju",
    "department": "Myyoga Teacher India Private Limited",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Pending from consultants review",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1053",
    "name": "GST, PT, S&E Registration",
    "manager": "Manju",
    "department": "Gridix E Software Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "GST, PT, S & E Registration to be obtained",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1054",
    "name": "Monthly billing amount to be fixed",
    "manager": "Manju",
    "department": "Gridix E Software Private Limited",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Monthly billing amount to be fixed by Sir",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1055",
    "name": "Applying for DMAT for company",
    "manager": "Manju",
    "department": "India Seed Ventures Private Limited",
    "teamMember": "Manju",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1056",
    "name": "Pradhan Mantri Viksit Bharat Rozgar Yojna application",
    "manager": "Manju",
    "department": "India Seed Ventures Private Limited",
    "teamMember": "Manju",
    "priority": "High",
    "status": "Completed",
    "dueDate": "",
    "progress": 0,
    "description": "Part A filled, part B portal is not working",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1057",
    "name": "MSA agreement",
    "manager": "Kavya",
    "department": "Secondlayer Technology India Pvt Ltd",
    "teamMember": "Rani",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Addendum to MSA agreement for the markup. Email sent, need to follow up.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1058",
    "name": "Juspay Inc - registration charges",
    "manager": "Kavya",
    "department": "Juspay Global Entities",
    "teamMember": "Kavya",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "Need to approve the email sent by Valuecent for the registration of California, Washington. Need to setup a call with Valuecent along with Dilip sir and Richa mam.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1059",
    "name": "Causeway Foundation bank account",
    "manager": "Ramya",
    "department": "Causeway Software Technologies India Private Limited",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "Pending",
    "dueDate": "",
    "progress": 0,
    "description": "Bank account deactivated. Vishal's self-attested KYC documents pending.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1060",
    "name": "Change of Directorship",
    "manager": "Ramya",
    "department": "Causeway Software Technologies India Private Limited",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "All statutory registrations. Started.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1061",
    "name": "Directorship change process from Kurt to Paul",
    "manager": "Ramya",
    "department": "Inseego India Private Limited",
    "teamMember": "Vijay",
    "priority": "High",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "All statutory registrations. Ongoing.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  },
  {
    "id": "TSK-1062",
    "name": "Change of registered address",
    "manager": "Ramya",
    "department": "Rize Agtech Private Limited",
    "teamMember": "Vijay",
    "priority": "Medium",
    "status": "In Progress",
    "dueDate": "",
    "progress": 0,
    "description": "All statutory registrations. Ongoing.",
    "blockers": "",
    "nextAction": "",
    "comments": []
  }
];

const NEW_MANAGER_USER = { id: 'USR-KAVYA', email: 'kavya@pdka.in', password: 'changeme', role: 'manager', manager: 'Kavya', name: 'Kavya' };

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const configCurrent = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'config', { users: [] });
  let managerAdded = false;
  if (!(configCurrent.users || []).some((u: any) => u.email === NEW_MANAGER_USER.email)) {
    await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'config', { ...configCurrent, users: [...(configCurrent.users || []), NEW_MANAGER_USER] });
    managerAdded = true;
  }

  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  const existingClientIds = new Set((current.clients || []).map((c: any) => c.id));
  const existingTaskIds = new Set((current.tasks || []).map((t: any) => t.id));
  const clientsToAdd = NEW_CLIENTS.filter((c: any) => !existingClientIds.has(c.id));
  const tasksToAdd = NEW_TASKS.filter((t: any) => !existingTaskIds.has(t.id));
  const updated = {
    ...current,
    clients: [...(current.clients || []), ...clientsToAdd],
    tasks: [...(current.tasks || []), ...tasksToAdd]
  };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', updated);

  return NextResponse.json({ clientsAdded: clientsToAdd.length, tasksAdded: tasksToAdd.length, totalClients: updated.clients.length, totalTasks: updated.tasks.length, kavyaManagerAdded: managerAdded });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });
  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  return NextResponse.json({ clientsCount: (current.clients||[]).length, tasksCount: (current.tasks||[]).length });
}
