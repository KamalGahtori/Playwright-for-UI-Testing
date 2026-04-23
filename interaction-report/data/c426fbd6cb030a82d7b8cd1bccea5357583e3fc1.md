# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interaction/interaction.spec.js >> Interaction Audit >> [about-us][Legacy-Circle] Interaction Audit
- Location: tests/interaction/interaction.spec.js:37:5

# Error details

```
Error: 

❌ INTERACTION FAILURES on [Legacy-Circle] (chromium-desktop) ❌
4 failure(s) detected:
  ❌ [button] Legends — not clickable: locator.click: Timeout 3000ms exceeded.
Call log:
  - wa
  ❌ [button] (unlabelled) — not clickable: locator.click: Timeout 3000ms exceeded.
Call log:
  - wa
  ❌ [button] (unlabelled) — not clickable: locator.click: Timeout 3000ms exceeded.
Call log:
  - wa
  ❌ [button] View
                    More — not clickable: locator.click: Timeout 3000ms exceeded.
Call log:
  - wa

Run 'npm run report' to review the highlighted screenshot.

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e7]:
      - img "Mail Icon" [ref=e8]
      - link "contact@ksolves.com" [ref=e9] [cursor=pointer]:
        - /url: mailto:contact@ksolves.com
      - img "Phone Icon" [ref=e10]
      - link "1800 121 0218" [ref=e11] [cursor=pointer]:
        - /url: tel:+911800 121 0218
      - generic [ref=e12]: ","
      - link "+1 (646) 203-1075" [ref=e13] [cursor=pointer]:
        - /url: tel:+1 (646) 203-1075
      - generic [ref=e14]: ","
      - link "+971 551395627" [ref=e15] [cursor=pointer]:
        - /url: tel:+971 551395627
      - link "investors" [ref=e16] [cursor=pointer]:
        - /url: https://api.whatsapp.com/send?phone=+918527471031&text=Hello, I Need Help!
        - button "investors" [ref=e17]:
          - img "investors" [ref=e18]
    - generic [ref=e19]:
      - link "Go to Homepage" [ref=e21] [cursor=pointer]:
        - /url: /
        - img "Ksolves logo" [ref=e22]
      - navigation [ref=e24]:
        - list [ref=e25]:
          - listitem [ref=e26]:
            - generic [ref=e27]:
              - link "About Us":
                - /url: /
          - listitem [ref=e28]:
            - generic [ref=e29]:
              - link "Services":
                - /url: /
          - listitem [ref=e30]:
            - generic [ref=e31]:
              - link "Support Services":
                - /url: /support-services
          - listitem [ref=e32]:
            - generic [ref=e33]:
              - link "Products":
                - /url: /
          - listitem [ref=e34]:
            - generic [ref=e35]:
              - link "Insights":
                - /url: /insights
          - listitem [ref=e36]:
            - link "Investors and News" [ref=e38] [cursor=pointer]:
              - /url: /investors
        - button "Contact Us" [ref=e39] [cursor=pointer]
  - main [ref=e40]:
    - generic [ref=e41]:
      - region "Legacy and Loyalty - Honoring Excellence at Ksolves" [ref=e42]:
        - img [ref=e44]
        - generic [ref=e48]:
          - generic "Honoring Excellence" [ref=e49]: HONORING EXCELLENCE
          - heading "Legacy and Loyalty" [level=1] [ref=e50]: Legacy & Loyalty
          - generic [ref=e51]: We honor our legacy and the values that shaped us. We proudly respect and appreciate employees who have stood with us for years; their loyalty, dedication, and commitment drive our continued success and future growth.
      - region "Legacy and Loyalty - Team Recognition" [ref=e52]:
        - generic [ref=e54]:
          - navigation "Team category navigation" [ref=e55]:
            - button "Navigate to Legends" [ref=e56] [cursor=pointer]:
              - generic [ref=e57]: Legends
            - button "Navigate to Elites" [ref=e58] [cursor=pointer]:
              - generic [ref=e59]: Elites
            - button "Navigate to Achievers" [ref=e60] [cursor=pointer]:
              - generic [ref=e61]: Achievers
          - generic [ref=e62]:
            - generic [ref=e63]:
              - generic [ref=e64]:
                - generic [ref=e65]:
                  - heading "Legends" [level=2] [ref=e66]
                  - generic [ref=e67]: We proudly celebrate our leaders with 10+ years of dedication, whose vision and commitment continue to shape our long-term success.
                - generic [ref=e68]:
                  - button "Previous" [ref=e69] [cursor=pointer]:
                    - img [ref=e70]
                  - button "Next" [ref=e72] [cursor=pointer]:
                    - img [ref=e73]
              - generic [ref=e78]:
                - generic [ref=e81]:
                  - generic [ref=e83]:
                    - generic:
                      - img
                    - generic [ref=e85]:
                      - img "Anil Singh Kushwaha" [ref=e87]
                      - generic [ref=e88]:
                        - generic [ref=e89]: Anil Singh Kushwaha
                        - generic [ref=e90]: Technology Head
                        - generic [ref=e91]: 12+ Years
                  - generic [ref=e92]:
                    - generic [ref=e94]: AS
                    - generic [ref=e95]: Anil Singh Kushwaha
                    - generic [ref=e96]: Technology Head
                    - generic [ref=e97]: When it comes to work, there are no boundaries that can stop him! He is one of the key pillars of Ksolves, sustaining a strong, decade-long bond with the company.
                    - generic [ref=e98]: 12+ Years
                - generic [ref=e101]:
                  - generic [ref=e103]:
                    - generic:
                      - img
                    - generic [ref=e105]:
                      - img "Om Prakash Maurya" [ref=e107]
                      - generic [ref=e108]:
                        - generic [ref=e109]: Om Prakash Maurya
                        - generic [ref=e110]: Technology Head
                        - generic [ref=e111]: 12+ Years
                  - generic [ref=e112]:
                    - generic [ref=e114]: OP
                    - generic [ref=e115]: Om Prakash Maurya
                    - generic [ref=e116]: Technology Head
                    - generic [ref=e117]: He is the backbone of the company, always ready to overcome any project challenges. A versatile, flexible, multi-tasker, and Maestro of multiple technologies.
                    - generic [ref=e118]: 12+ Years
                - generic [ref=e121]:
                  - generic [ref=e123]:
                    - generic:
                      - img
                    - generic [ref=e125]:
                      - img "Atul Khanduri" [ref=e127]
                      - generic [ref=e128]:
                        - generic [ref=e129]: Atul Khanduri
                        - generic [ref=e130]: Associate Technical Head
                        - generic [ref=e131]: 11+ Years
                  - generic [ref=e132]:
                    - generic [ref=e134]: AK
                    - generic [ref=e135]: Atul Khanduri
                    - generic [ref=e136]: Associate Technical Head
                    - generic [ref=e137]: A captain who is a pro in both technology and cricket. He has great leadership skills to handle any project challenge with Grace and a Smile!
                    - generic [ref=e138]: 11+ Years
                - generic [ref=e141]:
                  - generic [ref=e143]:
                    - generic:
                      - img
                    - generic [ref=e145]:
                      - img "Mayank Bhandari" [ref=e147]
                      - generic [ref=e148]:
                        - generic [ref=e149]: Mayank Bhandari
                        - generic [ref=e150]: Senior Technical Head
                        - generic [ref=e151]: 11+ Years
                  - generic [ref=e152]:
                    - generic [ref=e154]: MB
                    - generic [ref=e155]: Mayank Bhandari
                    - generic [ref=e156]: Senior Technical Head
                    - generic [ref=e157]: He conquers every challenge with his unwavering determination! From handling Magento to service projects, he has shown his talents and skills to handle every task with full dedication.
                    - generic [ref=e158]: 11+ Years
                - generic [ref=e161]:
                  - generic [ref=e163]:
                    - generic:
                      - img
                    - generic [ref=e165]:
                      - img "Ramesh Shinde" [ref=e167]
                      - generic [ref=e168]:
                        - generic [ref=e169]: Ramesh Shinde
                        - generic [ref=e170]: Delivery Head
                        - generic [ref=e171]: 11+ Years
                  - generic [ref=e172]:
                    - generic [ref=e174]: RS
                    - generic [ref=e175]: Ramesh Shinde
                    - generic [ref=e176]: Delivery Head
                    - generic [ref=e177]: One of the most senior and experienced resources at Ksolves! He has been skillfully managing one of our flagship projects and consistently getting clients appreciation for his quality work.
                    - generic [ref=e178]: 11+ Years
                - generic [ref=e181]:
                  - generic [ref=e183]:
                    - generic:
                      - img
                    - generic [ref=e185]:
                      - img "Rakesh Kumar" [ref=e187]
                      - generic [ref=e188]:
                        - generic [ref=e189]: Rakesh Kumar
                        - generic [ref=e190]: Senior Technical Lead
                        - generic [ref=e191]: 11+ Years
                  - generic [ref=e192]:
                    - generic [ref=e194]: RK
                    - generic [ref=e195]: Rakesh Kumar
                    - generic [ref=e196]: Senior Technical Lead
                    - generic [ref=e197]: With his Salesforce mastery and exceptional leadership qualities, he is leading our Salesforce team and is passionate about reaching new heights of success.
                    - generic [ref=e198]: 11+ Years
                - generic [ref=e201]:
                  - generic [ref=e203]:
                    - generic:
                      - img
                    - generic [ref=e205]:
                      - img "Sumit Huria" [ref=e207]
                      - generic [ref=e208]:
                        - generic [ref=e209]: Sumit Huria
                        - generic [ref=e210]: Center Head - Noida
                        - generic [ref=e211]: 10+ Years
                  - generic [ref=e212]:
                    - generic [ref=e214]: SH
                    - generic [ref=e215]: Sumit Huria
                    - generic [ref=e216]: Center Head - Noida
                    - generic [ref=e217]: With his single-handed skills, he is not only a pro at navigating our complex projects but also efficiently managing our vibrant Noida office.
                    - generic [ref=e218]: 10+ Years
                - generic [ref=e221]:
                  - generic [ref=e223]:
                    - generic:
                      - img
                    - generic [ref=e225]:
                      - img "Aayush Singhal" [ref=e227]
                      - generic [ref=e228]:
                        - generic [ref=e229]: Aayush Singhal
                        - generic [ref=e230]: Technical Project Manager
                        - generic [ref=e231]: 10+ Years
                  - generic [ref=e232]:
                    - generic [ref=e234]: AS
                    - generic [ref=e235]: Aayush Singhal
                    - generic [ref=e236]: Technical Project Manager
                    - generic [ref=e237]: He brings vision, structure, and technical mastery to every project he leads. His decisive leadership and problem-solving approach consistently deliver solutions that stand the test of time.
                    - generic [ref=e238]: 10+ Years
            - generic [ref=e239]:
              - generic [ref=e240]:
                - generic [ref=e241]:
                  - heading "The Elite" [level=2] [ref=e242]
                  - generic [ref=e243]: We value our experienced professionals with 7–9 years of service, whose expertise and consistency drive meaningful results.
                - generic [ref=e244]:
                  - button "Previous" [ref=e245] [cursor=pointer]:
                    - img [ref=e246]
                  - button "Next" [ref=e248] [cursor=pointer]:
                    - img [ref=e249]
              - generic [ref=e254]:
                - generic [ref=e257]:
                  - generic [ref=e259]:
                    - generic:
                      - img
                    - generic [ref=e261]:
                      - img "Sanjeet Kumar" [ref=e263]
                      - generic [ref=e264]:
                        - generic [ref=e265]: Sanjeet Kumar
                        - generic [ref=e266]: Technical Lead - UI Development
                        - generic [ref=e267]: 9+ Years
                  - generic [ref=e268]:
                    - generic [ref=e270]: SK
                    - generic [ref=e271]: Sanjeet Kumar
                    - generic [ref=e272]: Technical Lead - UI Development
                    - generic [ref=e273]: One of our dedicated designers has an exceptional ability to deliver outstanding designs that impress clients and bring success to the company.
                    - generic [ref=e274]: 9+ Years
                - generic [ref=e277]:
                  - generic [ref=e279]:
                    - generic:
                      - img
                    - generic [ref=e281]:
                      - img "Kirti Sharma" [ref=e283]
                      - generic [ref=e284]:
                        - generic [ref=e285]: Kirti Sharma
                        - generic [ref=e286]: Head - Business Development
                        - generic [ref=e287]: 8+ Years
                  - generic [ref=e288]:
                    - generic [ref=e290]: KS
                    - generic [ref=e291]: Kirti Sharma
                    - generic [ref=e292]: Head - Business Development
                    - generic [ref=e293]: There are no breaking Boundaries for her! Brilliantly heading the Business Development team of Ksolves and with her unwavering attitude of "We Can Do This"
                    - generic [ref=e294]: 8+ Years
                - generic [ref=e297]:
                  - generic [ref=e299]:
                    - generic:
                      - img
                    - generic [ref=e301]:
                      - img "Deepak Pandey" [ref=e303]
                      - generic [ref=e304]:
                        - generic [ref=e305]: Deepak Pandey
                        - generic [ref=e306]: Senior Software Engineer
                        - generic [ref=e307]: 7+ Years
                  - generic [ref=e308]:
                    - generic [ref=e310]: DP
                    - generic [ref=e311]: Deepak Pandey
                    - generic [ref=e312]: Senior Software Engineer
                    - generic [ref=e313]: A dynamic coder who brings playfulness to every line of code. With his mastery in Odoo and Spark, he sparks innovation across every project.
                    - generic [ref=e314]: 7+ Years
                - generic [ref=e317]:
                  - generic [ref=e319]:
                    - generic:
                      - img
                    - generic [ref=e321]:
                      - img "Jayveer Singh Chauhan" [ref=e323]
                      - generic [ref=e324]:
                        - generic [ref=e325]: Jayveer Singh Chauhan
                        - generic [ref=e326]: Senior Software Engineer
                        - generic [ref=e327]: 7+ Years
                  - generic [ref=e328]:
                    - generic [ref=e330]: JS
                    - generic [ref=e331]: Jayveer Singh Chauhan
                    - generic [ref=e332]: Senior Software Engineer
                    - generic [ref=e333]: Meet our Python Programming Expert and Django REST Framework specialist—a calm, genuine personality whose code speaks volumes.
                    - generic [ref=e334]: 7+ Years
                - generic [ref=e337]:
                  - generic [ref=e339]:
                    - generic:
                      - img
                    - generic [ref=e341]:
                      - img "Akanksha Saini" [ref=e343]
                      - generic [ref=e344]:
                        - generic [ref=e345]: Akanksha Saini
                        - generic [ref=e346]: Assistant Head HR
                        - generic [ref=e347]: 9+ Years
                  - generic [ref=e348]:
                    - generic [ref=e350]: AS
                    - generic [ref=e351]: Akanksha Saini
                    - generic [ref=e352]: Assistant Head HR
                    - generic [ref=e353]: Mastering the Art of Handling Any Situation with Grace She has charm with her exceptional ability to bridge the gap between technology and human potential.
                    - generic [ref=e354]: 9+ Years
                - generic [ref=e357]:
                  - generic [ref=e359]:
                    - generic:
                      - img
                    - generic [ref=e361]:
                      - img "Rabil Khanna" [ref=e363]
                      - generic [ref=e364]:
                        - generic [ref=e365]: Rabil Khanna
                        - generic [ref=e366]: Senior Software Test Engineer
                        - generic [ref=e367]: 8+ Years
                  - generic [ref=e368]:
                    - generic [ref=e370]: RK
                    - generic [ref=e371]: Rabil Khanna
                    - generic [ref=e372]: Senior Software Test Engineer
                    - generic [ref=e373]: A dedicated and workaholic employee! With his expertise and deep focus on digging into the codes, he always ensures the seamless execution of his projects.
                    - generic [ref=e374]: 8+ Years
                - generic [ref=e377]:
                  - generic [ref=e379]:
                    - generic:
                      - img
                    - generic [ref=e381]:
                      - img "Ankit Saxena" [ref=e383]
                      - generic [ref=e384]:
                        - generic [ref=e385]: Ankit Saxena
                        - generic [ref=e386]: Technical Lead
                        - generic [ref=e387]: 8+ Years
                  - generic [ref=e388]:
                    - generic [ref=e390]: AS
                    - generic [ref=e391]: Ankit Saxena
                    - generic [ref=e392]: Technical Lead
                    - generic [ref=e393]: A dedicated, silent, and workaholic developer who always keeps his eyes on the screen for developing codes. He is highly efficient and knows how to play with codes to run the project successfully.
                    - generic [ref=e394]: 8+ Years
                - generic [ref=e397]:
                  - generic [ref=e399]:
                    - generic:
                      - img
                    - generic [ref=e401]:
                      - img "Hitanshu Sharma" [ref=e403]
                      - generic [ref=e404]:
                        - generic [ref=e405]: Hitanshu Sharma
                        - generic [ref=e406]: Business Development Manager
                        - generic [ref=e407]: 7+ Years
                  - generic [ref=e408]:
                    - generic [ref=e410]: HS
                    - generic [ref=e411]: Hitanshu Sharma
                    - generic [ref=e412]: Business Development Manager
                    - generic [ref=e413]: He knows how to grab the tide of opportunities and turn them into success. With his dedication and unparalleled ability, he always tries to open new possibilities for the company’s growth
                    - generic [ref=e414]: 7+ Years
                - generic [ref=e417]:
                  - generic [ref=e419]:
                    - generic:
                      - img
                    - generic [ref=e421]:
                      - img "Rakesh Choudhary" [ref=e423]
                      - generic [ref=e424]:
                        - generic [ref=e425]: Rakesh Choudhary
                        - generic [ref=e426]: IT Operations Specialist
                        - generic [ref=e427]: 7+ Years
                  - generic [ref=e428]:
                    - generic [ref=e430]: RC
                    - generic [ref=e431]: Rakesh Choudhary
                    - generic [ref=e432]: IT Operations Specialist
                    - generic [ref=e433]: From troubleshooting to implementing cutting-edge IT solutions, he ensures the smooth process of our IT operations and keeps our Ksolves digital infrastructure running seamlessly.
                    - generic [ref=e434]: 7+ Years
                - generic [ref=e437]:
                  - generic [ref=e439]:
                    - generic:
                      - img
                    - generic [ref=e441]:
                      - img "Mayank Shukla" [ref=e443]
                      - generic [ref=e444]:
                        - generic [ref=e445]: Mayank Shukla
                        - generic [ref=e446]: Technical Project Manager
                        - generic [ref=e447]: 9+ Years
                  - generic [ref=e448]:
                    - generic [ref=e450]: MS
                    - generic [ref=e451]: Mayank Shukla
                    - generic [ref=e452]: Technical Project Manager
                    - generic [ref=e453]: A passionate Team leader who is always ready to beat the challenges in his energetic and proactive mode! He never says no to any challenging project and transforms them into victories.
                    - generic [ref=e454]: 9+ Years
                - generic [ref=e457]:
                  - generic [ref=e459]:
                    - generic:
                      - img
                    - generic [ref=e461]:
                      - img "Aashish Singh Tanwar" [ref=e463]
                      - generic [ref=e464]:
                        - generic [ref=e465]: Aashish Singh Tanwar
                        - generic [ref=e466]: Technical Project Manager
                        - generic [ref=e467]: 9+ Years
                  - generic [ref=e468]:
                    - generic [ref=e470]: AS
                    - generic [ref=e471]: Aashish Singh Tanwar
                    - generic [ref=e472]: Technical Project Manager
                    - generic [ref=e473]: He has a versatile and multi-talented personality packed with the perfect blend of technical expertise and creative prowess in dancing and cricket.
                    - generic [ref=e474]: 9+ Years
                - generic [ref=e477]:
                  - generic [ref=e479]:
                    - generic:
                      - img
                    - generic [ref=e481]:
                      - img "Abhinav Shrivastava" [ref=e483]
                      - generic [ref=e484]:
                        - generic [ref=e485]: Abhinav Shrivastava
                        - generic [ref=e486]: Data Analyst
                        - generic [ref=e487]: 7+ Years
                  - generic [ref=e488]:
                    - generic [ref=e490]: AS
                    - generic [ref=e491]: Abhinav Shrivastava
                    - generic [ref=e492]: Data Analyst
                    - generic [ref=e493]: 7+ Years
            - generic [ref=e494]:
              - generic [ref=e495]:
                - heading "Achievers" [level=2] [ref=e496]
                - generic [ref=e497]: We proudly acknowledge our 50+ achievers with 5–6 years of experience as the backbone of our ongoing success.
              - generic [ref=e498]:
                - generic [ref=e499]:
                  - generic [ref=e501]:
                    - generic: 6+
                    - generic [ref=e502]: Kartik Saini
                    - generic [ref=e503]: Odoo Consultant and Support Assistance Lead
                  - generic [ref=e505]:
                    - generic: 6+
                    - generic [ref=e506]: Nisha Singh
                    - generic [ref=e507]: Technical Lead
                  - generic [ref=e509]:
                    - generic: 6+
                    - generic [ref=e510]: Ram Karan
                    - generic [ref=e511]: Senior Software Test Engineer
                  - generic [ref=e513]:
                    - generic: 6+
                    - generic [ref=e514]: Arti Aggarwal
                    - generic [ref=e515]: Project Manager
                - generic [ref=e516]:
                  - generic [ref=e518]:
                    - generic: 6+
                    - generic [ref=e519]: Bhavya Srivastava
                    - generic [ref=e520]: Senior HR Executive
                  - generic [ref=e522]:
                    - generic: 6+
                    - generic [ref=e523]: Adnan Mirza Beg
                    - generic [ref=e524]: Technical Lead
                  - generic [ref=e526]:
                    - generic: 6+
                    - generic [ref=e527]: Manish Gurnani
                    - generic [ref=e528]: Chief Technology Officer
                  - generic [ref=e530]:
                    - generic: 6+
                    - generic [ref=e531]: Himanshi Grover
                    - generic [ref=e532]: Senior QA Engineer
                - generic [ref=e533]:
                  - generic [ref=e535]:
                    - generic: 6+
                    - generic [ref=e536]: Gaurav Kumar
                    - generic [ref=e537]: Senior Software Engineer
                  - generic [ref=e539]:
                    - generic: 6+
                    - generic [ref=e540]: Ezzuddin Dalal
                    - generic [ref=e541]: Senior UI Developer
                  - generic [ref=e543]:
                    - generic: 6+
                    - generic [ref=e544]: Nitesh Hardia
                    - generic [ref=e545]: Senior Technical Lead
                  - generic [ref=e547]:
                    - generic: 6+
                    - generic [ref=e548]: Navneet Kumar
                    - generic [ref=e549]: Senior Software Engineer
              - generic [ref=e550]:
                - generic [ref=e551]:
                  - generic [ref=e553]:
                    - generic: 6+
                    - generic [ref=e554]: Alok Kumar Singh
                    - generic [ref=e555]: Software Engineer
                  - generic [ref=e557]:
                    - generic: 6+
                    - generic [ref=e558]: Sandeep Kumar Singh
                    - generic [ref=e559]: Senior Software Engineer
                  - generic [ref=e561]:
                    - generic: 6+
                    - generic [ref=e562]: Dipak Kumar Singh
                    - generic [ref=e563]: Technical Lead
                  - generic [ref=e565]:
                    - generic: 6+
                    - generic [ref=e566]: Md Asad Khan
                    - generic [ref=e567]: Technical Project Manager
                - generic [ref=e568]:
                  - generic [ref=e570]:
                    - generic: 6+
                    - generic [ref=e571]: Vishwam Pandey
                    - generic [ref=e572]: Business Development Manager
                  - generic [ref=e574]:
                    - generic: 6+
                    - generic [ref=e575]: Ashish Kumar Chaubey
                    - generic [ref=e576]: Senior Software Engineer
                  - generic [ref=e578]:
                    - generic: 6+
                    - generic [ref=e579]: Abhinav Chadha
                    - generic [ref=e580]: Technical Lead
                  - generic [ref=e582]:
                    - generic: 6+
                    - generic [ref=e583]: Vivek Singh
                    - generic [ref=e584]: Technical Lead
                - generic [ref=e585]:
                  - generic [ref=e587]:
                    - generic: 6+
                    - generic [ref=e588]: Ketan Goel
                    - generic [ref=e589]: Technical Lead
                  - generic [ref=e591]:
                    - generic: 6+
                    - generic [ref=e592]: Pushpendra Singh Lodhi
                    - generic [ref=e593]: Technical Lead
                  - generic [ref=e595]:
                    - generic: 6+
                    - generic [ref=e596]: Manoj Kumar
                    - generic [ref=e597]: Senior Software Engineer
                  - generic [ref=e599]:
                    - generic: 6+
                    - generic [ref=e600]: Vikrant Sharma
                    - generic [ref=e601]: Technical Lead
                - generic [ref=e602]:
                  - generic [ref=e604]:
                    - generic: 6+
                    - generic [ref=e605]: Neha Negi
                    - generic [ref=e606]: Presales and Business Associate Head
                  - generic [ref=e608]:
                    - generic: 5+
                    - generic [ref=e609]: Romil Bhawsar
                    - generic [ref=e610]: Technical Lead
                  - generic [ref=e612]:
                    - generic: 5+
                    - generic [ref=e613]: Rahul Sharma
                    - generic [ref=e614]: Senior Software Engineer
                  - generic [ref=e616]:
                    - generic: 5+
                    - generic [ref=e617]: Kunal Wadhwa
                    - generic [ref=e618]: Senior Software Engineer
                - generic [ref=e619]:
                  - generic [ref=e621]:
                    - generic: 5+
                    - generic [ref=e622]: Pankaj Kumar Singh
                    - generic [ref=e623]: Senior Software Engineer
                  - generic [ref=e625]:
                    - generic: 5+
                    - generic [ref=e626]: Abhay Pandey
                    - generic [ref=e627]: Senior UI/UX Designer
                  - generic [ref=e629]:
                    - generic: 5+
                    - generic [ref=e630]: Satendra Sharma
                    - generic [ref=e631]: "Centre Head : Indore"
                  - generic [ref=e633]:
                    - generic: 5+
                    - generic [ref=e634]: Manoj Pandey
                    - generic [ref=e635]: Admin Manager
                - generic [ref=e636]:
                  - generic [ref=e638]:
                    - generic: 5+
                    - generic [ref=e639]: Aadesh Srivastava
                    - generic [ref=e640]: Senior Software Test Engineer
                  - generic [ref=e642]:
                    - generic: 5+
                    - generic [ref=e643]: Kamal Asawara
                    - generic [ref=e644]: Senior Technical Manager
                  - generic [ref=e646]:
                    - generic: 5+
                    - generic [ref=e647]: Aman Kothiyal
                    - generic [ref=e648]: Senior Software Engineer
                  - generic [ref=e650]:
                    - generic: 5+
                    - generic [ref=e651]: Mantej Kaur Hanspal
                    - generic [ref=e652]: Senior Software Engineer
                - generic [ref=e653]:
                  - generic [ref=e655]:
                    - generic: 5+
                    - generic [ref=e656]: Divyam Tripathi
                    - generic [ref=e657]: Senior Software Engineer
                  - generic [ref=e659]:
                    - generic: 5+
                    - generic [ref=e660]: Shivani Pachori
                    - generic [ref=e661]: Senior Software Test Engineer
                  - generic [ref=e663]:
                    - generic: 5+
                    - generic [ref=e664]: Deepshikha Varma
                    - generic [ref=e665]: Senior Technical Lead
                  - generic [ref=e667]:
                    - generic: 5+
                    - generic [ref=e668]: Rahul Bhardwaj
                    - generic [ref=e669]: Senior Technical Lead
                - generic [ref=e670]:
                  - generic [ref=e672]:
                    - generic: 5+
                    - generic [ref=e673]: Naushad Alam
                    - generic [ref=e674]: Senior UI Developer
                  - generic [ref=e676]:
                    - generic: 5+
                    - generic [ref=e677]: Shailesh Negi
                    - generic [ref=e678]: Senior Software Engineer
                  - generic [ref=e680]:
                    - generic: 5+
                    - generic [ref=e681]: Kamlesh Negi
                    - generic [ref=e682]: Senior Software Engineer
                  - generic [ref=e684]:
                    - generic: 5+
                    - generic [ref=e685]: Saloni Kasera
                    - generic [ref=e686]: IT Sales Manager
                - generic [ref=e687]:
                  - generic [ref=e689]:
                    - generic: 5+
                    - generic [ref=e690]: Umang Soni
                    - generic [ref=e691]: Chief Financial Officer
                  - generic [ref=e693]:
                    - generic: 5+
                    - generic [ref=e694]: Vijay Kumar Srivastava
                    - generic [ref=e695]: Senior Software Engineer
                  - generic [ref=e697]:
                    - generic: 5+
                    - generic [ref=e698]: Anu Yadav
                    - generic [ref=e699]: Senior QA Engineer
                  - generic [ref=e701]:
                    - generic: 5+
                    - generic [ref=e702]: Abhinav Anand
                    - generic [ref=e703]: Senior Software Test Engineer
                - generic [ref=e704]:
                  - generic [ref=e706]:
                    - generic: 5+
                    - generic [ref=e707]: Mohit Patel
                    - generic [ref=e708]: Senior Software Engineer
                  - generic [ref=e710]:
                    - generic: 5+
                    - generic [ref=e711]: Manisha Kide
                    - generic [ref=e712]: Company Secretary and Compliance Officer
              - button "View more achievers" [ref=e714] [cursor=pointer]: View Less
      - region "Employee recognition and awards at Ksolves" [ref=e715]:
        - generic [ref=e716]:
          - heading "Recognizing Excellence. Inspiring Growth." [level=2] [ref=e717]
          - paragraph [ref=e718]: We believe in recognizing effort, celebrating excellence, and investing in our people. At Ksolves, every achievement is acknowledged, and every milestone is a step toward personal and professional growth.
        - region "Awards gallery carousel" [ref=e720]:
          - generic [ref=e722]:
            - article "Award gallery slide 3 of 4" [ref=e724]:
              - figure [ref=e725]:
                - img "Ksolves excellence recognition moment" [ref=e726]
              - generic [ref=e727]:
                - figure [ref=e728]:
                  - img "Team award ceremony highlights" [ref=e729]
                - figure [ref=e730]:
                  - img "Ksolves performers receiving recognition" [ref=e731]
              - figure [ref=e732]:
                - img "Ksolves award presentation on stage" [ref=e733]
            - article "Award gallery slide 4 of 4" [ref=e735]:
              - figure [ref=e736]:
                - img "Employee recognition ceremony at Ksolves" [ref=e737]
              - generic [ref=e738]:
                - figure [ref=e739]:
                  - img "Ksolves Legacy Circle event highlights" [ref=e740]
                - figure [ref=e741]:
                  - img "Award recipients group photo" [ref=e742]
              - figure [ref=e743]:
                - img "Ksolves annual awards celebration" [ref=e744]
            - article "Award gallery slide 1 of 4" [ref=e746]:
              - figure [ref=e747]:
                - img "Ksolves employee receiving Exemplar award on stage" [ref=e748]
              - generic [ref=e749]:
                - figure [ref=e750]:
                  - img "Speaker at Ksolves Legacy Circle event" [ref=e751]
                - figure [ref=e752]:
                  - img "Ksolves Annual Awards 2024-25 team photo" [ref=e753]
              - figure [ref=e754]:
                - img "Employee receiving Exemplar Award trophy" [ref=e755]
            - article "Award gallery slide 2 of 4" [ref=e757]:
              - figure [ref=e758]:
                - img "Ksolves team member at awards ceremony" [ref=e759]
              - generic [ref=e760]:
                - figure [ref=e761]:
                  - img "Ksolves Legacy Circle award presentation" [ref=e762]
                - figure [ref=e763]:
                  - img "Team celebration at Ksolves annual event" [ref=e764]
              - figure [ref=e765]:
                - img "Award recipients at Ksolves gala" [ref=e766]
            - article "Award gallery slide 3 of 4" [ref=e768]:
              - figure [ref=e769]:
                - img "Ksolves excellence recognition moment" [ref=e770]
              - generic [ref=e771]:
                - figure [ref=e772]:
                  - img "Team award ceremony highlights" [ref=e773]
                - figure [ref=e774]:
                  - img "Ksolves performers receiving recognition" [ref=e775]
              - figure [ref=e776]:
                - img "Ksolves award presentation on stage" [ref=e777]
            - article "Award gallery slide 4 of 4" [ref=e779]:
              - figure [ref=e780]:
                - img "Employee recognition ceremony at Ksolves" [ref=e781]
              - generic [ref=e782]:
                - figure [ref=e783]:
                  - img "Ksolves Legacy Circle event highlights" [ref=e784]
                - figure [ref=e785]:
                  - img "Award recipients group photo" [ref=e786]
              - figure [ref=e787]:
                - img "Ksolves annual awards celebration" [ref=e788]
            - article "Award gallery slide 1 of 4" [ref=e790]:
              - figure [ref=e791]:
                - img "Ksolves employee receiving Exemplar award on stage" [ref=e792]
              - generic [ref=e793]:
                - figure [ref=e794]:
                  - img "Speaker at Ksolves Legacy Circle event" [ref=e795]
                - figure [ref=e796]:
                  - img "Ksolves Annual Awards 2024-25 team photo" [ref=e797]
              - figure [ref=e798]:
                - img "Employee receiving Exemplar Award trophy" [ref=e799]
            - article "Award gallery slide 2 of 4" [ref=e801]:
              - figure [ref=e802]:
                - img "Ksolves team member at awards ceremony" [ref=e803]
              - generic [ref=e804]:
                - figure [ref=e805]:
                  - img "Ksolves Legacy Circle award presentation" [ref=e806]
                - figure [ref=e807]:
                  - img "Team celebration at Ksolves annual event" [ref=e808]
              - figure [ref=e809]:
                - img "Award recipients at Ksolves gala" [ref=e810]
          - generic [ref=e811]:
            - button [ref=e812] [cursor=pointer]
            - button [ref=e813] [cursor=pointer]
            - button [ref=e814] [cursor=pointer]
            - button [ref=e815] [cursor=pointer]
    - generic [ref=e818]:
      - img "img" [ref=e820]
      - img "img" [ref=e822]
      - img "img" [ref=e824]
      - img "img" [ref=e826]
      - img "img" [ref=e828]
      - img "img" [ref=e830]
      - img "img" [ref=e832]
  - contentinfo [ref=e833]:
    - generic [ref=e834]:
      - generic [ref=e836]:
        - generic [ref=e837]:
          - generic [ref=e838]:
            - img "Ksolves logo" [ref=e839]
            - paragraph [ref=e841]: Ksolves India Limited is a leading Software Development Company dedicated to working on cutting-edge technologies like Big Data, Machine Learning, Salesforce®, Odoo, etc. With a team of 550+ developers and architects, we are consistently delivering innovative and customized software solutions that drive growth, efficiency, and success for our client’s businesses. With our outstanding IT services and solutions, we have earned the unwavering trust of clients spanning the globe.
            - generic [ref=e842]: Get in Touch With Us
            - generic [ref=e843]:
              - img "phone" [ref=e844]
              - link "1800 121 0218" [ref=e845] [cursor=pointer]:
                - /url: tel:+911800 121 0218
              - generic [ref=e846]: ","
              - link "+1 (646) 203-1075" [ref=e847] [cursor=pointer]:
                - /url: tel:+1 (646) 203-1075
              - generic [ref=e848]: ","
              - link "+971 551395627" [ref=e849] [cursor=pointer]:
                - /url: tel:+971 551395627
            - link "investors+91 8527471031" [ref=e851] [cursor=pointer]:
              - /url: https://api.whatsapp.com/send?phone=+918527471031&text=Hello, I Need Help!
              - img "investors" [ref=e852]
              - text: +91 8527471031
            - generic [ref=e853]:
              - img "mail" [ref=e854]
              - link "sales@ksolves.com" [ref=e855] [cursor=pointer]:
                - /url: mailto:sales@ksolves.com
          - generic [ref=e856]:
            - generic [ref=e857]: Services
            - navigation [ref=e858]:
              - list [ref=e859]:
                - listitem [ref=e860]:
                  - link "AI & ML" [ref=e861] [cursor=pointer]:
                    - /url: /ai-ml-services
                - listitem [ref=e862]:
                  - link "Big Data" [ref=e863] [cursor=pointer]:
                    - /url: /big-data-consulting-company
                - listitem [ref=e864]:
                  - link "Salesforce" [ref=e865] [cursor=pointer]:
                    - /url: /salesforce-services
                - listitem [ref=e866]:
                  - link "Odoo" [ref=e867] [cursor=pointer]:
                    - /url: /odoo-development-company
                - listitem [ref=e868]:
                  - link "DevOps" [ref=e869] [cursor=pointer]:
                    - /url: /devops-consulting-services
                - listitem [ref=e870]:
                  - link "Databricks" [ref=e871] [cursor=pointer]:
                    - /url: /databricks-consulting-services
                - listitem [ref=e872]:
                  - link "Snowflake" [ref=e873] [cursor=pointer]:
                    - /url: /snowflake-consulting-services
                - listitem [ref=e874]:
                  - link "RFP Consulting" [ref=e875] [cursor=pointer]:
                    - /url: /request-for-proposal
          - generic [ref=e876]:
            - generic [ref=e877]: Quick Links
            - list [ref=e879]:
              - listitem [ref=e880]:
                - link "Blogs" [ref=e881] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e882]:
                - link "Ksolves Store" [ref=e883] [cursor=pointer]:
                  - /url: https://store.ksolves.com/
              - listitem [ref=e884]:
                - link "CSR Initiatives" [ref=e885] [cursor=pointer]:
                  - /url: /csr-initiatives
              - listitem [ref=e886]:
                - link "Site Map" [ref=e887] [cursor=pointer]:
                  - /url: /sitemap
              - listitem [ref=e888]:
                - link "About Us" [ref=e889] [cursor=pointer]:
                  - /url: /about-us-ksolves
              - listitem [ref=e890]:
                - link "Investors" [ref=e891] [cursor=pointer]:
                  - /url: /investors
              - listitem [ref=e892]:
                - link "Culture" [ref=e893] [cursor=pointer]:
                  - /url: /life-at-ksolves
              - listitem [ref=e894]:
                - link "Careers We are Hiring" [ref=e895] [cursor=pointer]:
                  - /url: /careers
                  - text: Careers
                  - superscript: We are Hiring
              - listitem [ref=e896]:
                - link "Contact Us" [ref=e897] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e898]: Global Presence
        - generic [ref=e899]:
          - generic [ref=e900]:
            - img "india gate" [ref=e901]
            - generic [ref=e902]:
              - paragraph [ref=e903]: India
              - list [ref=e904]:
                - listitem [ref=e905]:
                  - img "location" [ref=e906]
                  - text: Noida
                - listitem [ref=e907]:
                  - img "location" [ref=e908]
                  - text: Pune
                - listitem [ref=e909]:
                  - img "location" [ref=e910]
                  - text: Indore
          - generic [ref=e911]:
            - img "statue of liberty" [ref=e912]
            - list [ref=e914]:
              - listitem [ref=e915]: USA
              - listitem [ref=e916]:
                - img "usa" [ref=e917]
                - text: Wyoming
          - generic [ref=e918]:
            - img "statue of liberty" [ref=e919]
            - list [ref=e921]:
              - listitem [ref=e922]: UAE
              - listitem [ref=e923]:
                - img "usa" [ref=e924]
                - text: Dubai
        - generic [ref=e925]: Follow Us
        - list [ref=e926]:
          - listitem [ref=e927]:
            - link "Go to Homepage" [ref=e928] [cursor=pointer]:
              - /url: https://www.facebook.com/people/Ksolves/100063995947513/
              - img "icons" [ref=e929]
          - listitem [ref=e930]:
            - link "Go to Homepage" [ref=e931] [cursor=pointer]:
              - /url: https://twitter.com/_Ksolves
              - img "icons" [ref=e932]
          - listitem [ref=e933]:
            - link "Go to Homepage" [ref=e934] [cursor=pointer]:
              - /url: https://www.instagram.com/_ksolves/
              - img "icons" [ref=e935]
          - listitem [ref=e936]:
            - link "Go to Homepage" [ref=e937] [cursor=pointer]:
              - /url: https://www.linkedin.com/company/ksolves
              - img "icons" [ref=e938]
          - listitem [ref=e939]:
            - link "Go to Homepage" [ref=e940] [cursor=pointer]:
              - /url: https://www.youtube.com/channel/UCplv9V47g9VidekGN6Wp1ew
              - img "icons" [ref=e941]
          - listitem [ref=e942]:
            - link "Go to Homepage" [ref=e943] [cursor=pointer]:
              - /url: https://in.pinterest.com/ksolvesindialimited/
              - img "icons" [ref=e944]
      - generic [ref=e945]:
        - generic [ref=e946]: Have A Project Idea?
        - generic [ref=e949]:
          - generic [ref=e950]:
            - generic [ref=e951]: Name*
            - textbox "Name*" [ref=e952]:
              - /placeholder: Full Name
          - generic [ref=e953]:
            - generic [ref=e954]: Email*
            - textbox "Email*" [ref=e955]:
              - /placeholder: Email Address
          - generic [ref=e956]:
            - generic [ref=e957]: Phone Number*
            - generic [ref=e959]:
              - generic:
                - 'generic "India (भारत): +91"'
              - textbox "Phone Number*" [ref=e962]:
                - /placeholder: ""
                - text: "+91"
          - generic [ref=e963]:
            - generic [ref=e964]: Message*
            - textbox "Message*" [ref=e965]:
              - /placeholder: Message
          - generic [ref=e967]:
            - generic [ref=e968]:
              - text: What is
              - generic [ref=e969]: "4"
              - text: +
              - generic [ref=e970]: "3"
              - text: "?"
              - generic [ref=e971]: "*"
              - link "icon" [ref=e972] [cursor=pointer]:
                - /url: javascript:void(0);
                - img "icon" [ref=e973]
            - spinbutton [ref=e975]
          - generic [ref=e976]:
            - button "Submit" [disabled]
    - generic [ref=e977]:
      - generic [ref=e978]: Copyright 2026© Ksolves.com | All Rights Reserved
      - img "Ksolves USP" [ref=e980]
      - list [ref=e981]:
        - listitem [ref=e982]:
          - link "Sitemap" [ref=e983] [cursor=pointer]:
            - /url: https://www.ksolves.com/sitemap
        - listitem [ref=e984]:
          - link "Privacy Policy" [ref=e985] [cursor=pointer]:
            - /url: https://www.ksolves.com/privacy-policy
        - listitem [ref=e986]:
          - link "Terms and Conditions" [ref=e987] [cursor=pointer]:
            - /url: https://www.ksolves.com/terms-and-conditions
```

# Test source

```ts
  71  |       await test.step('Running Interaction Audit', async () => {
  72  |         auditResult = await runInteractionAudit(page, endpoint.id);
  73  |       });
  74  | 
  75  |       const { allResults, counts, fails, warns } = auditResult;
  76  | 
  77  |       // ── Annotations (visible in HTML report) ──────────────────────
  78  |       test.info().annotations.push({
  79  |         type: 'Interaction Summary',
  80  |         description: `PASS:${counts.PASS} FAIL:${counts.FAIL} WARN:${counts.WARN} SKIP:${counts.SKIP} | Project:${projectName}`,
  81  |       });
  82  | 
  83  |       if (warns.length) {
  84  |         test.info().annotations.push({
  85  |           type: 'Warnings',
  86  |           description: warns.map(w => `[${w.category}] ${w.label}: ${w.detail}`).join(' | '),
  87  |         });
  88  |       }
  89  | 
  90  |       if (fails.length) {
  91  |         test.info().annotations.push({
  92  |           type: 'Failures',
  93  |           description: fails.map(f => `[${f.category}] ${f.label}: ${f.detail}`).join(' | '),
  94  |         });
  95  |       }
  96  | 
  97  |       // ── Attach full audit results as JSON ──────────────────────────
  98  |       await test.info().attach('audit-results.json', {
  99  |         body: JSON.stringify({ summary: counts, fails, warns }, null, 2),
  100 |         contentType: 'application/json',
  101 |       });
  102 | 
  103 |       // ── Highlight failing elements and capture screenshot ──────────
  104 |       if (fails.length || warns.length) {
  105 |         await test.step('Capturing Highlighted Failures Screenshot', async () => {
  106 |           // Highlight every matching element; scroll the first one into view so
  107 |           // it appears in the viewport-level screenshot.
  108 |           const found = await page.evaluate((items) => {
  109 |             let scrolled = false;
  110 |             let foundCount = 0;
  111 |             for (const { category, label, href } of items) {
  112 |               const color = category === 'WARN' ? 'orange' : 'red';
  113 |               const matches = [];
  114 | 
  115 |               if (category.startsWith('link') && href) {
  116 |                 const el = document.querySelector(`a[href="${href}"]`);
  117 |                 if (el) matches.push(el);
  118 |               } else if (category === 'button') {
  119 |                 for (const b of document.querySelectorAll('button, [role="button"]')) {
  120 |                   if ((b.textContent || b.value || b.getAttribute('aria-label') || '').trim().startsWith(label.slice(0, 25))) {
  121 |                     matches.push(b);
  122 |                     break; // highlight only the first DOM match per failure entry
  123 |                   }
  124 |                 }
  125 |               } else if (category === 'input') {
  126 |                 const el = document.querySelector(`input[placeholder="${label}"], input[name="${label}"], textarea[placeholder="${label}"]`);
  127 |                 if (el) matches.push(el);
  128 |               } else if (category === 'select') {
  129 |                 const el = document.querySelector(`select[name="${label}"]`);
  130 |                 if (el) matches.push(el);
  131 |               }
  132 | 
  133 |               for (const el of matches) {
  134 |                 el.style.outline = `4px solid ${color}`;
  135 |                 el.style.outlineOffset = '3px';
  136 |                 el.style.backgroundColor = color === 'red' ? 'rgba(255,0,0,0.15)' : 'rgba(255,165,0,0.15)';
  137 |                 foundCount++;
  138 |                 if (!scrolled) {
  139 |                   el.scrollIntoView({ behavior: 'instant', block: 'center' });
  140 |                   scrolled = true;
  141 |                 }
  142 |               }
  143 |             }
  144 |             return foundCount;
  145 |           }, [...fails.map(f => ({ ...f, category: f.category })), ...warns.map(w => ({ ...w }))]);
  146 | 
  147 |           // Viewport screenshot — taken after scrollIntoView so the first
  148 |           // highlighted element is centred and clearly visible.
  149 |           const viewportShot = await page.screenshot();
  150 |           await test.info().attach('highlighted-failures-viewport.png', { body: viewportShot, contentType: 'image/png' });
  151 | 
  152 |           // Full-page screenshot for overall context.
  153 |           const fullShot = await page.screenshot({ fullPage: true });
  154 |           await test.info().attach('highlighted-failures-fullpage.png', { body: fullShot, contentType: 'image/png' });
  155 | 
  156 |           if (found === 0) {
  157 |             // Elements couldn't be located in the DOM at screenshot time (e.g. inside
  158 |             // a closed overlay). Attach a plain viewport capture so there is still
  159 |             // something to review.
  160 |             test.info().annotations.push({
  161 |               type: 'Screenshot note',
  162 |               description: 'Failing elements could not be located in the DOM at screenshot time — they may be inside a closed overlay or cross-origin iframe.',
  163 |             });
  164 |           }
  165 |         });
  166 |       }
  167 | 
  168 |       // ── Assert ─────────────────────────────────────────────────────
  169 |       if (fails.length) {
  170 |         const failList = fails.map(f => `  ❌ [${f.category}] ${f.label} — ${f.detail}`).join('\n');
> 171 |         throw new Error(
      |               ^ Error: 
  172 |           `\n\n❌ INTERACTION FAILURES on [${endpoint.id}] (${projectName}) ❌\n` +
  173 |           `${fails.length} failure(s) detected:\n${failList}\n\n` +
  174 |           `Run 'npm run report' to review the highlighted screenshot.\n`
  175 |         );
  176 |       }
  177 | 
  178 |     });
  179 |   }
  180 | 
  181 | });
  182 | 
```