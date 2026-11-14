export const questionTranslations = {
  en: {
    'itp-01': {
      prompt: 'A company views growth in a new customer segment as a business opportunity. Which SWOT element is this?',
      options: ['Strength', 'Weakness', 'Opportunity', 'Threat'],
      explanation: 'In SWOT, opportunities and threats are external factors, while strengths and weaknesses are internal. Growth in a customer segment is an external opportunity.',
    },
    'itp-02': {
      prompt: 'A system costs 2.4 million yen to implement and is expected to save 600,000 yen each year. What is its simple payback period?',
      options: ['2 years', '3 years', '4 years', '5 years'],
      explanation: 'Divide the initial cost by the annual savings: 2.4 million yen ÷ 600,000 yen = 4 years.',
    },
    'itp-03': {
      prompt: 'Which document records agreed targets, such as availability and response time, between an IT service provider and its customer?',
      options: ['SLA', 'NDA', 'RFP', 'WBS'],
      explanation: 'A Service Level Agreement (SLA) defines the agreed service level, including measures such as availability and performance.',
    },
    'itp-04': {
      prompt: 'Which method breaks project deliverables down into a hierarchy of manageable work units?',
      options: ['Benchmarking', 'WBS', 'Break-even analysis', 'Critical path method'],
      explanation: 'A Work Breakdown Structure (WBS) hierarchically decomposes project deliverables and work. It supports estimating, assigning, and tracking tasks.',
    },
    'itp-05': {
      prompt: 'Which disaster-recovery metric defines the maximum acceptable amount of data loss measured in time?',
      options: ['RTO', 'RPO', 'ROI', 'KPI'],
      explanation: 'Recovery Point Objective (RPO) describes the acceptable time range of data loss. Recovery Time Objective (RTO) is the target time to restore service.',
    },
    'itp-06': {
      prompt: 'Which system looks up the IP address that corresponds to a domain name entered by a user?',
      options: ['DNS', 'DHCP', 'SMTP', 'NTP'],
      explanation: 'DNS manages the mapping between domain names and IP addresses. DHCP assigns network settings to devices.',
    },
    'itp-07': {
      prompt: 'Which technique is suitable for checking whether a saved file has changed?',
      options: ['Comparing hash values', 'Encrypting with a shared key', 'Comparing compression ratios', 'Converting character encoding'],
      explanation: 'Comparing hash values calculated from the same data can detect changes. A hash value cannot be used to reconstruct the original data.',
    },
    'itp-08': {
      prompt: 'Which principle grants users only the access rights they need for their work?',
      options: ['Defense in depth', 'Principle of least privilege', 'Fail-safe', 'Foolproof design'],
      explanation: 'The principle of least privilege gives users and programs only the minimum permissions required, limiting the impact of mistakes or compromise.',
    },
    'itp-09': {
      prompt: 'Fixed costs are 3 million yen. Each product sells for 1,000 yen and has a variable cost of 700 yen. What is the break-even sales volume?',
      options: ['3,000 units', '7,000 units', '10,000 units', '30,000 units'],
      explanation: 'Break-even volume = fixed costs ÷ (selling price − variable cost). 3,000,000 ÷ (1,000 − 700) = 10,000 units.',
    },
    'itp-10': {
      prompt: 'Which protocol is generally used to send email?',
      options: ['IMAP', 'SMTP', 'POP3', 'SNMP'],
      explanation: 'SMTP is used to send email and transfer it between mail servers. IMAP and POP3 are primarily used to access received messages.',
    },
    'itp-11': {
      prompt: 'Which metric represents a company’s sales as a proportion of total sales in its market?',
      options: ['Operating margin', 'Market share', 'Equity ratio', 'Labor productivity'],
      explanation: 'Market share is the proportion of total market sales or volume accounted for by a company.',
    },
    'itp-12': {
      prompt: 'Which authentication method uses a password together with a verification code sent to a smartphone?',
      options: ['Single sign-on', 'Multi-factor authentication', 'Federated sign-on', 'Access control list'],
      explanation: 'Multi-factor authentication strengthens identity checks by combining different factor types, such as knowledge and possession.',
    },
    'itp-13': {
      prompt: 'Which project management method identifies the longest sequence of dependent tasks that determines the completion date?',
      options: ['Critical path method', 'Brainstorming', 'Break-even analysis', 'Benchmarking'],
      explanation: 'The critical path is the sequence of tasks whose delay would delay the whole project. It is monitored closely during scheduling.',
    },
    'itp-14': {
      prompt: 'In a relational database, what is used to uniquely identify each row in a table?',
      options: ['Foreign key', 'Primary key', 'View', 'Index name'],
      explanation: 'A primary key is a column or combination of columns that uniquely identifies each row and cannot contain duplicate or NULL values.',
    },
    'itp-15': {
      prompt: 'Which metric evaluates an investment by discounting future cash flows to the present and subtracting the initial investment?',
      options: ['Net present value (NPV)', 'Operating margin', 'Total asset turnover', 'Break-even ratio'],
      explanation: 'Net present value (NPV) is the total present value of future cash flows minus the initial investment.',
    },
    'itp-16': {
      prompt: 'What is the processing approach in which multiple computers coordinate over a network to share work or resources?',
      options: ['Distributed processing', 'Centralized processing', 'Batch processing', 'Sequential processing'],
      explanation: 'Distributed processing uses multiple networked computers to share processing tasks, data, or resources.',
    },
    'fe-01': {
      prompt: 'What decimal value does the hexadecimal number D6 represent as an 8-bit two’s-complement integer?',
      options: ['−42', '−38', '42', '214'],
      explanation: 'D6 is 214 when interpreted as unsigned. In 8-bit two’s complement, subtract 256: 214 − 256 = −42.',
    },
    'fe-02': {
      prompt: 'If a portion that accounts for 40% of execution time is made four times faster, what is the approximate speedup of the whole program?',
      options: ['1.18×', '1.25×', '1.43×', '2.50×'],
      explanation: 'By Amdahl’s law, overall speedup is 1 ÷ (0.60 + 0.40 ÷ 4), which is approximately 1.43×.',
    },
    'fe-03': {
      prompt: 'What is the time complexity of binary search, which repeatedly halves a sorted array’s search range?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      explanation: 'Each comparison reduces the search range by about half, so the number of comparisons grows in proportion to log n.',
    },
    'fe-04': {
      prompt: 'What is the time complexity of scanning an array of n elements once to find its maximum value?',
      options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
      explanation: 'Each element is compared a constant number of times, so the amount of work is proportional to n.',
    },
    'fe-05': {
      prompt: 'In an SQL query that counts employees by department, which clause groups rows by department?',
      options: ['ORDER BY', 'GROUP BY', 'DISTINCT', 'INSERT INTO'],
      explanation: 'GROUP BY groups rows that share a value in the specified column, allowing aggregate functions such as COUNT to be applied to each group.',
    },
    'fe-06': {
      prompt: 'What is a likely effect of adding an index to a database table?',
      options: ['Searches can become faster, while updates require extra work and storage', 'Every search is guaranteed to take constant time', 'The table is automatically encrypted', 'Duplicate data is always removed'],
      explanation: 'An index can narrow the search, but inserts, updates, and deletes must also maintain it. Indexes consume storage as well.',
    },
    'fe-07': {
      prompt: 'How many total IP addresses are in an IPv4 subnet with a /26 prefix?',
      options: ['32', '64', '128', '256'],
      explanation: 'The host portion has 32 − 26 = 6 bits, so there are 2⁶ = 64 total addresses. In a typical subnet, the network and broadcast addresses are reserved.',
    },
    'fe-08': {
      prompt: 'In a digital signature using public-key cryptography, which key does the sender use to create the signature?',
      options: ['The sender’s private key', 'The sender’s public key', 'The recipient’s public key', 'A shared secret key'],
      explanation: 'The sender creates the signature with their private key. The recipient verifies it with the sender’s public key.',
    },
    'fe-09': {
      prompt: 'Which measure can help prevent deadlock when processes wait for resources held by one another?',
      options: ['Require resources to be requested in a consistent order', 'Increase the time slice', 'Reduce the page size in main memory', 'Lower the CPU clock speed'],
      explanation: 'A consistent resource-acquisition order helps prevent circular wait, one of the necessary conditions for deadlock.',
    },
    'fe-10': {
      prompt: 'Which method uses polynomial arithmetic to calculate a value for detecting errors in transmitted data?',
      options: ['CRC', 'DNS', 'NAT', 'ARP'],
      explanation: 'A cyclic redundancy check (CRC) treats data as a polynomial over GF(2) and uses a generator polynomial to calculate a check value for error detection.',
    },
    'fe-11': {
      prompt: 'How many bytes are in 1 KiB (kibibyte)?',
      options: ['100', '1,000', '1,024', '10,000'],
      explanation: 'A kibibyte is 2 to the tenth power bytes, or 1,024 bytes. A kilobyte (kB) can mean 1,000 bytes.',
    },
    'fe-12': {
      prompt: 'Which data structure returns the most recently stored item first?',
      options: ['Queue', 'Stack', 'Tree', 'Hash table'],
      explanation: 'A stack uses last-in, first-out (LIFO) ordering: the most recently stored item is removed first.',
    },
    'fe-13': {
      prompt: 'In a database transaction, which property means that all operations succeed together or are all rolled back?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
      explanation: 'Atomicity treats a transaction as one unit: either all of its operations are applied or none of them are.',
    },
    'fe-14': {
      prompt: 'Which protocol encrypts communication between a web browser and server and can verify the server using a certificate?',
      options: ['TLS', 'DHCP', 'SNMP', 'NTP'],
      explanation: 'Transport Layer Security (TLS) provides encryption and authentication for secure communication, including HTTPS.',
    },
    'fe-15': {
      prompt: 'Why is a different random value added to each password before hashing it for storage?',
      options: ['To prevent identical passwords from producing identical stored hashes', 'To make the password recoverable from its hash', 'To increase network speed', 'To shorten public keys'],
      explanation: 'A unique salt makes hashes different even when passwords match and makes precomputed hash attacks more difficult.',
    },
    'fe-16': {
      prompt: 'Which component near the CPU temporarily stores frequently used data to reduce the speed gap with main memory?',
      options: ['Cache memory', 'Secondary storage', 'Virtual memory', 'Input/output buffer'],
      explanation: 'Cache memory is fast storage close to the CPU that holds frequently used data or instructions to reduce memory access time.',
    },
  },
  th: {
    'itp-01': {
      prompt: 'บริษัทมองว่าการเติบโตของกลุ่มลูกค้าใหม่เป็นโอกาสทางธุรกิจ ปัจจัยนี้จัดอยู่ในส่วนใดของ SWOT?',
      options: ['จุดแข็ง (Strength)', 'จุดอ่อน (Weakness)', 'โอกาส (Opportunity)', 'อุปสรรค (Threat)'],
      explanation: 'ในการวิเคราะห์ SWOT โอกาสและอุปสรรคเป็นปัจจัยภายนอก ส่วนจุดแข็งและจุดอ่อนเป็นปัจจัยภายใน การเติบโตของกลุ่มลูกค้าเป็นโอกาสจากปัจจัยภายนอก',
    },
    'itp-02': {
      prompt: 'ระบบมีค่าใช้จ่ายในการติดตั้ง 2.4 ล้านเยน และคาดว่าจะช่วยประหยัดได้ปีละ 600,000 เยน ระยะเวลาคืนทุนอย่างง่ายคือเท่าใด?',
      options: ['2 ปี', '3 ปี', '4 ปี', '5 ปี'],
      explanation: 'นำค่าใช้จ่ายเริ่มต้นหารด้วยเงินที่ประหยัดได้ต่อปี: 2.4 ล้านเยน ÷ 600,000 เยน = 4 ปี',
    },
    'itp-03': {
      prompt: 'เอกสารใดใช้บันทึกข้อตกลงระหว่างผู้ให้บริการ IT กับลูกค้า เช่น เป้าหมายด้านความพร้อมใช้งานและเวลาตอบสนอง?',
      options: ['SLA', 'NDA', 'RFP', 'WBS'],
      explanation: 'ข้อตกลงระดับการให้บริการ (SLA) กำหนดระดับบริการที่ทั้งสองฝ่ายตกลงกัน เช่น ความพร้อมใช้งานและประสิทธิภาพ',
    },
    'itp-04': {
      prompt: 'วิธีใดใช้แยกผลงานของโครงการออกเป็นลำดับชั้นของงานย่อยที่จัดการได้?',
      options: ['การเทียบมาตรฐาน', 'WBS', 'การวิเคราะห์จุดคุ้มทุน', 'วิธีเส้นทางวิกฤต'],
      explanation: 'โครงสร้างการแบ่งงาน (WBS) แยกผลงานและงานของโครงการออกเป็นลำดับชั้น ช่วยในการประมาณเวลา มอบหมายงาน และติดตามความคืบหน้า',
    },
    'itp-05': {
      prompt: 'ตัวชี้วัดใดในการกู้คืนระบบหลังภัยพิบัติระบุปริมาณข้อมูลสูงสุดที่ยอมรับให้สูญหายได้ในหน่วยเวลา?',
      options: ['RTO', 'RPO', 'ROI', 'KPI'],
      explanation: 'Recovery Point Objective (RPO) ระบุช่วงเวลาของข้อมูลที่ยอมรับให้สูญหายได้ ส่วน Recovery Time Objective (RTO) คือเวลาเป้าหมายในการกู้คืนบริการ',
    },
    'itp-06': {
      prompt: 'ระบบใดค้นหาที่อยู่ IP ที่ตรงกับชื่อโดเมนที่ผู้ใช้ป้อน?',
      options: ['DNS', 'DHCP', 'SMTP', 'NTP'],
      explanation: 'DNS จัดการการจับคู่ระหว่างชื่อโดเมนกับที่อยู่ IP ส่วน DHCP ใช้กำหนดค่าระบบเครือข่ายให้กับอุปกรณ์',
    },
    'itp-07': {
      prompt: 'เทคนิคใดเหมาะสำหรับตรวจสอบว่าไฟล์ที่บันทึกไว้มีการเปลี่ยนแปลงหรือไม่?',
      options: ['เปรียบเทียบค่าแฮช', 'เข้ารหัสด้วยกุญแจร่วม', 'เปรียบเทียบอัตราการบีบอัด', 'แปลงรหัสอักขระ'],
      explanation: 'การเปรียบเทียบค่าแฮชที่คำนวณจากข้อมูลเดียวกันช่วยตรวจจับการเปลี่ยนแปลงได้ แต่ไม่สามารถใช้ค่าแฮชเพื่อกู้คืนข้อมูลต้นฉบับ',
    },
    'itp-08': {
      prompt: 'หลักการใดกำหนดให้ผู้ใช้มีสิทธิ์เข้าถึงเฉพาะส่วนที่จำเป็นต่อการทำงาน?',
      options: ['การป้องกันหลายชั้น', 'หลักการให้สิทธิ์เท่าที่จำเป็น', 'ระบบทำงานอย่างปลอดภัยเมื่อขัดข้อง', 'การออกแบบป้องกันความผิดพลาดจากผู้ใช้'],
      explanation: 'หลักการให้สิทธิ์เท่าที่จำเป็นจะมอบสิทธิ์ขั้นต่ำที่ผู้ใช้หรือโปรแกรมต้องใช้ เพื่อลดผลกระทบจากความผิดพลาดหรือการถูกโจมตี',
    },
    'itp-09': {
      prompt: 'ต้นทุนคงที่ 3 ล้านเยน ราคาขายต่อชิ้น 1,000 เยน และต้นทุนผันแปรต่อชิ้น 700 เยน ปริมาณขาย ณ จุดคุ้มทุนเป็นเท่าใด?',
      options: ['3,000 ชิ้น', '7,000 ชิ้น', '10,000 ชิ้น', '30,000 ชิ้น'],
      explanation: 'ปริมาณจุดคุ้มทุน = ต้นทุนคงที่ ÷ (ราคาขาย − ต้นทุนผันแปร) ดังนั้น 3,000,000 ÷ (1,000 − 700) = 10,000 ชิ้น',
    },
    'itp-10': {
      prompt: 'โดยทั่วไปใช้โปรโตคอลใดในการส่งอีเมล?',
      options: ['IMAP', 'SMTP', 'POP3', 'SNMP'],
      explanation: 'SMTP ใช้ส่งอีเมลและถ่ายโอนอีเมลระหว่างเซิร์ฟเวอร์ ส่วน IMAP และ POP3 ใช้เข้าถึงอีเมลที่ได้รับเป็นหลัก',
    },
    'itp-11': {
      prompt: 'ตัวชี้วัดใดแสดงสัดส่วนยอดขายของบริษัทเมื่อเทียบกับยอดขายทั้งหมดในตลาด?',
      options: ['อัตรากำไรจากการดำเนินงาน', 'ส่วนแบ่งตลาด', 'อัตราส่วนทุน', 'ผลิตภาพแรงงาน'],
      explanation: 'ส่วนแบ่งตลาดคือสัดส่วนของยอดขายหรือปริมาณขายทั้งหมดในตลาดที่บริษัทครองอยู่',
    },
    'itp-12': {
      prompt: 'วิธีการยืนยันตัวตนใดใช้รหัสผ่านร่วมกับรหัสยืนยันที่ส่งไปยังสมาร์ตโฟน?',
      options: ['การลงชื่อเข้าใช้ครั้งเดียว', 'การยืนยันตัวตนหลายปัจจัย', 'การลงชื่อเข้าใช้แบบรวมศูนย์', 'รายการควบคุมการเข้าถึง'],
      explanation: 'การยืนยันตัวตนหลายปัจจัยเพิ่มความปลอดภัยโดยใช้ปัจจัยต่างประเภท เช่น สิ่งที่รู้และสิ่งที่ครอบครอง',
    },
    'itp-13': {
      prompt: 'วิธีการจัดการโครงการใดใช้ระบุลำดับงานที่ขึ้นต่อกันและยาวที่สุด ซึ่งกำหนดวันเสร็จสิ้นโครงการ?',
      options: ['วิธีเส้นทางวิกฤต', 'การระดมสมอง', 'การวิเคราะห์จุดคุ้มทุน', 'การเทียบมาตรฐาน'],
      explanation: 'เส้นทางวิกฤตคือลำดับงานที่หากล่าช้าจะทำให้โครงการทั้งหมดล่าช้าด้วย จึงต้องติดตามอย่างใกล้ชิด',
    },
    'itp-14': {
      prompt: 'ในฐานข้อมูลเชิงสัมพันธ์ สิ่งใดใช้ระบุแต่ละแถวในตารางให้ไม่ซ้ำกัน?',
      options: ['คีย์นอก', 'คีย์หลัก', 'วิว', 'ชื่อดัชนี'],
      explanation: 'คีย์หลักคือคอลัมน์หรือชุดคอลัมน์ที่ระบุแต่ละแถวได้ไม่ซ้ำ และต้องไม่มีค่าซ้ำหรือค่า NULL',
    },
    'itp-15': {
      prompt: 'ตัวชี้วัดใดประเมินการลงทุนโดยคิดลดกระแสเงินสดในอนาคตเป็นมูลค่าปัจจุบันแล้วหักเงินลงทุนเริ่มแรก?',
      options: ['มูลค่าปัจจุบันสุทธิ (NPV)', 'อัตรากำไรจากการดำเนินงาน', 'อัตราหมุนเวียนสินทรัพย์รวม', 'อัตราส่วนจุดคุ้มทุน'],
      explanation: 'มูลค่าปัจจุบันสุทธิ (NPV) คือผลรวมมูลค่าปัจจุบันของกระแสเงินสดในอนาคต หักด้วยเงินลงทุนเริ่มแรก',
    },
    'itp-16': {
      prompt: 'แนวทางการประมวลผลใดที่คอมพิวเตอร์หลายเครื่องทำงานร่วมกันผ่านเครือข่ายเพื่อแบ่งงานหรือใช้ทรัพยากรร่วมกัน?',
      options: ['การประมวลผลแบบกระจาย', 'การประมวลผลแบบรวมศูนย์', 'การประมวลผลแบบกลุ่ม', 'การประมวลผลตามลำดับ'],
      explanation: 'การประมวลผลแบบกระจายใช้คอมพิวเตอร์หลายเครื่องที่เชื่อมต่อเครือข่ายเพื่อแบ่งงาน ข้อมูล หรือทรัพยากร',
    },
    'fe-01': {
      prompt: 'เลขฐานสิบหก D6 มีค่าเป็นเท่าใดเมื่อแทนจำนวนเต็มแบบ two’s complement ขนาด 8 บิต?',
      options: ['−42', '−38', '42', '214'],
      explanation: 'D6 มีค่า 214 หากอ่านเป็นเลขไม่มีเครื่องหมาย สำหรับ two’s complement 8 บิต ให้ลบ 256: 214 − 256 = −42',
    },
    'fe-02': {
      prompt: 'หากเร่งส่วนที่ใช้เวลา 40% ของการทำงานให้เร็วขึ้น 4 เท่า โปรแกรมโดยรวมจะเร็วขึ้นประมาณเท่าใด?',
      options: ['1.18 เท่า', '1.25 เท่า', '1.43 เท่า', '2.50 เท่า'],
      explanation: 'ตามกฎของ Amdahl อัตราเร่งโดยรวมคือ 1 ÷ (0.60 + 0.40 ÷ 4) ซึ่งมีค่าประมาณ 1.43 เท่า',
    },
    'fe-03': {
      prompt: 'ความซับซ้อนด้านเวลาของ binary search ที่แบ่งช่วงค้นหาในอาร์เรย์ที่เรียงแล้วออกเป็นครึ่งซ้ำ ๆ คือเท่าใด?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      explanation: 'การเปรียบเทียบแต่ละครั้งลดช่วงค้นหาลงประมาณครึ่งหนึ่ง จำนวนครั้งที่ต้องเปรียบเทียบจึงเพิ่มตาม log n',
    },
    'fe-04': {
      prompt: 'การไล่ตรวจอาร์เรย์ที่มี n สมาชิกหนึ่งครั้งเพื่อหาค่าสูงสุด มีความซับซ้อนด้านเวลาเท่าใด?',
      options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
      explanation: 'แต่ละสมาชิกถูกเปรียบเทียบจำนวนครั้งคงที่ ปริมาณงานจึงแปรผันตาม n',
    },
    'fe-05': {
      prompt: 'ในคำสั่ง SQL ที่นับจำนวนพนักงานแยกตามแผนก ข้อความใดใช้จัดกลุ่มแถวตามแผนก?',
      options: ['ORDER BY', 'GROUP BY', 'DISTINCT', 'INSERT INTO'],
      explanation: 'GROUP BY จัดกลุ่มแถวที่มีค่าในคอลัมน์ที่ระบุเหมือนกัน ทำให้ใช้ฟังก์ชันรวม เช่น COUNT กับแต่ละกลุ่มได้',
    },
    'fe-06': {
      prompt: 'ผลที่มักเกิดขึ้นเมื่อเพิ่มดัชนีให้ตารางฐานข้อมูลคือข้อใด?',
      options: ['ค้นหาได้เร็วขึ้น แต่อัปเดตต้องทำงานเพิ่มและใช้พื้นที่จัดเก็บ', 'รับประกันว่าการค้นหาทุกครั้งใช้เวลาคงที่', 'ข้อมูลในตารางถูกเข้ารหัสโดยอัตโนมัติ', 'ข้อมูลซ้ำถูกลบออกเสมอ'],
      explanation: 'ดัชนีช่วยจำกัดขอบเขตการค้นหา แต่การเพิ่ม แก้ไข หรือลบข้อมูลต้องปรับปรุงดัชนีด้วย และดัชนียังใช้พื้นที่จัดเก็บ',
    },
    'fe-07': {
      prompt: 'ซับเน็ต IPv4 ที่มี prefix /26 มีที่อยู่ IP ทั้งหมดกี่หมายเลข?',
      options: ['32', '64', '128', '256'],
      explanation: 'ส่วน host มี 32 − 26 = 6 บิต จึงมีที่อยู่ทั้งหมด 2⁶ = 64 หมายเลข โดยทั่วไปจะสงวนที่อยู่เครือข่ายและบรอดคาสต์ไว้',
    },
    'fe-08': {
      prompt: 'ในการสร้างลายมือชื่อดิจิทัลด้วยการเข้ารหัสกุญแจสาธารณะ ผู้ส่งใช้กุญแจใด?',
      options: ['กุญแจส่วนตัวของผู้ส่ง', 'กุญแจสาธารณะของผู้ส่ง', 'กุญแจสาธารณะของผู้รับ', 'กุญแจลับที่ใช้ร่วมกัน'],
      explanation: 'ผู้ส่งสร้างลายมือชื่อด้วยกุญแจส่วนตัวของตนเอง ผู้รับใช้กุญแจสาธารณะของผู้ส่งเพื่อตรวจสอบลายมือชื่อ',
    },
    'fe-09': {
      prompt: 'มาตรการใดช่วยป้องกัน deadlock ที่เกิดเมื่อหลายโปรเซสรอทรัพยากรซึ่งกันและกัน?',
      options: ['กำหนดลำดับการร้องขอทรัพยากรให้เหมือนกัน', 'เพิ่มช่วงเวลา time slice', 'ลดขนาดเพจในหน่วยความจำหลัก', 'ลดความเร็วสัญญาณนาฬิกาของ CPU'],
      explanation: 'การกำหนดลำดับการขอทรัพยากรให้เหมือนกันช่วยป้องกันการรอเป็นวงจร ซึ่งเป็นหนึ่งในเงื่อนไขที่จำเป็นของ deadlock',
    },
    'fe-10': {
      prompt: 'วิธีใดใช้การคำนวณพหุนามเพื่อหาค่าตรวจสอบสำหรับตรวจจับข้อผิดพลาดในข้อมูลที่ส่ง?',
      options: ['CRC', 'DNS', 'NAT', 'ARP'],
      explanation: 'Cyclic Redundancy Check (CRC) มองข้อมูลเป็นพหุนามเหนือ GF(2) และใช้พหุนามกำเนิดเพื่อคำนวณค่าตรวจสอบสำหรับตรวจจับข้อผิดพลาด',
    },
    'fe-11': {
      prompt: '1 KiB (kibibyte) มีจำนวนกี่ไบต์?',
      options: ['100', '1,000', '1,024', '10,000'],
      explanation: '1 KiB เท่ากับ 2 ยกกำลัง 10 หรือ 1,024 ไบต์ ส่วน 1 kB อาจหมายถึง 1,000 ไบต์',
    },
    'fe-12': {
      prompt: 'โครงสร้างข้อมูลใดนำข้อมูลที่จัดเก็บล่าสุดออกมาก่อน?',
      options: ['คิว', 'สแตก', 'ต้นไม้', 'ตารางแฮช'],
      explanation: 'สแตกใช้หลัก LIFO (เข้าทีหลังออกก่อน) ข้อมูลที่จัดเก็บล่าสุดจึงถูกนำออกก่อน',
    },
    'fe-13': {
      prompt: 'ในธุรกรรมฐานข้อมูล คุณสมบัติใดหมายความว่าการดำเนินการทั้งหมดสำเร็จพร้อมกันหรือถูกยกเลิกทั้งหมด?',
      options: ['ความเป็นหน่วยเดียว', 'ความสอดคล้อง', 'การแยกจากกัน', 'ความคงทน'],
      explanation: 'Atomicity จัดการธุรกรรมเป็นหน่วยเดียว โดยดำเนินการทั้งหมดหรือยกเลิกทั้งหมด',
    },
    'fe-14': {
      prompt: 'โปรโตคอลใดเข้ารหัสการสื่อสารระหว่างเว็บเบราว์เซอร์กับเซิร์ฟเวอร์ และตรวจสอบเซิร์ฟเวอร์ด้วยใบรับรองได้?',
      options: ['TLS', 'DHCP', 'SNMP', 'NTP'],
      explanation: 'Transport Layer Security (TLS) ให้การเข้ารหัสและการยืนยันตัวตนสำหรับการสื่อสารที่ปลอดภัย รวมถึง HTTPS',
    },
    'fe-15': {
      prompt: 'เหตุใดจึงเพิ่มค่าสุ่มที่แตกต่างกันให้กับรหัสผ่านแต่ละรายการก่อนคำนวณแฮชเพื่อจัดเก็บ?',
      options: ['เพื่อไม่ให้รหัสผ่านเดียวกันได้ค่าแฮชที่จัดเก็บเหมือนกัน', 'เพื่อกู้คืนรหัสผ่านจากค่าแฮชได้', 'เพื่อเพิ่มความเร็วเครือข่าย', 'เพื่อทำให้กุญแจสาธารณะสั้นลง'],
      explanation: 'Salt ที่ไม่ซ้ำกันทำให้รหัสผ่านเดียวกันได้ค่าแฮชต่างกัน และทำให้การโจมตีด้วยตารางแฮชที่คำนวณไว้ล่วงหน้าทำได้ยากขึ้น',
    },
    'fe-16': {
      prompt: 'ส่วนประกอบใดที่อยู่ใกล้ CPU และเก็บข้อมูลที่ใช้บ่อยชั่วคราวเพื่อลดช่องว่างความเร็วกับหน่วยความจำหลัก?',
      options: ['แคชเมมโมรี', 'หน่วยเก็บข้อมูลรอง', 'หน่วยความจำเสมือน', 'บัฟเฟอร์รับส่งข้อมูล'],
      explanation: 'แคชเมมโมรีเป็นหน่วยความจำความเร็วสูงใกล้ CPU ใช้เก็บข้อมูลหรือคำสั่งที่เรียกใช้บ่อยเพื่อลดเวลาเข้าถึงหน่วยความจำ',
    },
  },
}

export function localizeQuestion(question, language) {
  const translation = questionTranslations[language]?.[question.id]
  return translation ? { ...question, ...translation } : question
}