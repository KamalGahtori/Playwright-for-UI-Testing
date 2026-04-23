# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interaction/interaction.spec.js >> Interaction Audit >> [about-us][About-Us] Interaction Audit
- Location: tests/interaction/interaction.spec.js:37:5

# Error details

```
Error: 

❌ INTERACTION FAILURES on [About-Us] (chromium-desktop) ❌
1 failure(s) detected:
  ❌ [link-external] https://www.mid-day.com/brand-media/article/ksolves-surfaces-as-an-industry-grad — HTTP 404 (external — verify link manually if unexpected)

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
      - generic [ref=e43]:
        - heading "Shaping the Future Through Intelligent Tech" [level=1] [ref=e44]
        - paragraph [ref=e45]:
          - text: At Ksolves India Limited, we deliver end-to-end software solutions that scale with your business. Backed by
          - text: 550+ experts and a global presence, we turn complex challenges into impactful results.
        - button "Let’s Connect" [ref=e46] [cursor=pointer]:
          - text: Let’s Connect
          - img [ref=e47]
      - generic [ref=e51]:
        - generic [ref=e52]: Overview
        - generic [ref=e53]:
          - paragraph [ref=e54]: Ksolves India Limited is your trusted software development partner, delivering tailored solutions that align with your vision and unique business needs. As a publicly traded company listed on India’s largest stock exchange - the National Stock Exchange (NSE), and Asia’s oldest - the Bombay Stock Exchange (BSE) , we have a proven track record of serving clients across the globe. With 550+ in-house technology experts, we design, develop, and deploy high-impact software backed by exceptional talent and world-class customer service. Our global presence ensures round-the-clock support and collaboration across all time zones.
          - paragraph [ref=e55]: Recognized as a 360-degree software solutions provider, Ksolves is known for its deep expertise in Big Data (Apache Kafka, NiFi, Spark, Cassandra), Data Science (Artificial Intelligence & Machine Learning), Salesforce, DevOps, Java & Microservices, OpenShift, Penetration Testing, and more. Whatever your challenge, we deliver results you can measure and trust.
        - region "Company statistics and certifications" [ref=e56]:
          - list "Key company metrics" [ref=e57]:
            - listitem [ref=e58]:
              - paragraph [ref=e59]: 350+
              - paragraph [ref=e60]: Certified Developers (Salesforce, AWS and Odoo)
            - listitem [ref=e61]:
              - paragraph [ref=e62]: 550+
              - paragraph [ref=e63]: Talented Workforce
            - listitem [ref=e64]:
              - paragraph [ref=e65]: 700+
              - paragraph [ref=e66]: Projects Successfully Delivered
            - listitem [ref=e67]:
              - paragraph [ref=e68]: 40+
              - paragraph [ref=e69]: Trusted & Satisfied Worldwide Clients
          - separator [ref=e70]
          - list "Company credentials and certifications" [ref=e71]:
            - listitem [ref=e72]:
              - generic [ref=e73]:
                - img "Salesforce Summit Partner badge" [ref=e74]
                - img "Odoo Gold Partner certification" [ref=e75]
                - img "Frappe Certified Partner badge" [ref=e76]
              - paragraph [ref=e77]: Salesforce Summit(Platinum) Partner, Odoo Gold Partner and Frappe Partner
            - listitem [ref=e78]:
              - img "CMMI Level 3 certification logo" [ref=e79]
              - paragraph [ref=e80]: CMMI Level 3 Certified Company
            - listitem [ref=e81]:
              - paragraph [ref=e82]: 30+
              - paragraph [ref=e83]: Countries Served Driving Digital Transformation Worldwide
            - listitem [ref=e84]:
              - img "24x7 customer support headset icon" [ref=e85]
              - paragraph [ref=e86]: 24x7 Customer Support
      - generic [ref=e88]:
        - generic [ref=e89]: "Our Global Offices: One Team, One Vision!"
        - generic [ref=e90]:
          - generic [ref=e91]:
            - iframe [ref=e93]:
              
            - generic [ref=e94]:
              - generic [ref=e95]: Pune Office
              - generic [ref=e96]: At Ksolves, we ensure that every employee gets the best and most comfortable working environment to stay motivated and bring the best out of them. Our Pune team cheers every moment together and is always ready to face challenges.
          - generic [ref=e97]:
            - iframe [ref=e99]:
              
            - generic [ref=e100]:
              - generic [ref=e101]: Indore Office
              - generic [ref=e102]: We know that team culture can make or break the company's progress. Our Indore office teams are highly motivated and fueled with positive attitudes to foster growth and continual development. After all, our team's support is behind our growth!
          - generic [ref=e103]:
            - iframe [ref=e105]:
              
            - generic [ref=e106]:
              - generic [ref=e107]: Noida Office
              - generic [ref=e108]: We have built a happy and healthy work culture that fosters collaboration and motivates our employees. Our teams at the Noida office are always filled with enthusiasm and passionate about delivering the best services.
          - generic [ref=e109]:
            - img "No description available" [ref=e111]
            - generic [ref=e112]:
              - generic [ref=e113]: US Office
              - generic [ref=e114]: We have established our roots across the globe, and our US office marks the initial stride towards transforming our dream into a tangible reality.
          - generic [ref=e115]:
            - img "No description available" [ref=e117]
            - generic [ref=e118]:
              - generic [ref=e119]: Dubai Office
              - generic [ref=e120]: We operate an office in Dubai to support our regional operations and client engagements across the Middle East. This helps us stay aligned with market needs and time zones.
      - generic [ref=e122]:
        - generic [ref=e123]: Services
        - generic [ref=e124]: Uncover the Power of Advanced Technologies with Us
        - generic [ref=e125]:
          - link "No description available AI/ML" [ref=e126] [cursor=pointer]:
            - /url: /ai-and-machine-learning-consulting-company
            - img "No description available" [ref=e128]
            - generic [ref=e129]: AI/ML
          - link "No description available Big Data" [ref=e130] [cursor=pointer]:
            - /url: /big-data-consulting-company
            - img "No description available" [ref=e132]
            - generic [ref=e133]: Big Data
          - link "No description available Salesforce" [ref=e134] [cursor=pointer]:
            - /url: /salesforce-services
            - img "No description available" [ref=e136]
            - generic [ref=e137]: Salesforce
          - link "No description available Odoo" [ref=e138] [cursor=pointer]:
            - /url: /odoo-development-company
            - img "No description available" [ref=e140]
            - generic [ref=e141]: Odoo
          - link "No description available Apache Kafka" [ref=e142] [cursor=pointer]:
            - /url: /apache-kafka-development-company
            - img "No description available" [ref=e144]
            - generic [ref=e145]: Apache Kafka
          - link "No description available Apache NiFi" [ref=e146] [cursor=pointer]:
            - /url: /apache-nifi-development-company
            - img "No description available" [ref=e148]
            - generic [ref=e149]: Apache NiFi
          - link "No description available Apache Spark" [ref=e150] [cursor=pointer]:
            - /url: /apache-spark-development-company
            - img "No description available" [ref=e152]
            - generic [ref=e153]: Apache Spark
          - link "No description available Apache Cassandra" [ref=e154] [cursor=pointer]:
            - /url: /apache-cassandra-development-company
            - img "No description available" [ref=e156]
            - generic [ref=e157]: Apache Cassandra
          - link "No description available DevOps" [ref=e158] [cursor=pointer]:
            - /url: /devops-consulting-services
            - img "No description available" [ref=e160]
            - generic [ref=e161]: DevOps
          - link "No description available Microservices" [ref=e162] [cursor=pointer]:
            - /url: /microservices-architecture-development-company
            - img "No description available" [ref=e164]
            - generic [ref=e165]: Microservices
          - link "No description available Snowflake" [ref=e166] [cursor=pointer]:
            - /url: /snowflake-consulting-services
            - img "No description available" [ref=e168]
            - generic [ref=e169]: Snowflake
          - link "No description available Databricks" [ref=e170] [cursor=pointer]:
            - /url: /databricks-consulting-services
            - img "No description available" [ref=e172]
            - generic [ref=e173]: Databricks
      - generic [ref=e175]:
        - generic [ref=e176]:
          - heading "Milestones" [level=4] [ref=e177]
          - heading "Symbolic Moments Carving The Aurora Of Ksolves" [level=2] [ref=e178]
        - generic [ref=e179]:
          - generic [ref=e181]:
            - paragraph [ref=e183]: 2012–2018
            - generic [ref=e184]:
              - heading "The Foundation Years" [level=3] [ref=e185]
              - generic [ref=e186]:
                - heading "2012" [level=4] [ref=e187]
                - paragraph [ref=e188]:
                  - text: Founded as Kartik Solution by Mr. Ratan
                  - text: Srivastava in Indirapuram.
              - generic [ref=e189]:
                - heading "2014" [level=4] [ref=e190]
                - paragraph [ref=e191]: Rebranded as Ksolves India Pvt. Ltd.
              - generic [ref=e192]:
                - heading "2015" [level=4] [ref=e193]
                - paragraph [ref=e194]:
                  - text: Achieved ISO certification and became a
                  - text: NASSCOM member.
              - generic [ref=e195]:
                - heading "2016" [level=4] [ref=e196]
                - paragraph [ref=e197]: Grew to 50+ employees.
              - generic [ref=e198]:
                - heading "2017" [level=4] [ref=e199]
                - paragraph [ref=e200]:
                  - text: Moved to a larger Noida office; reached
                  - text: 40+ clients.
              - generic [ref=e201]:
                - heading "2018" [level=4] [ref=e202]
                - paragraph [ref=e203]: Hit 80% client retention.
          - generic [ref=e205]:
            - paragraph [ref=e207]: 2019–2024
            - generic [ref=e208]:
              - heading "Rapid Growth & Global Recognition" [level=3] [ref=e209]
              - generic [ref=e210]:
                - heading "2019" [level=4] [ref=e211]
                - paragraph [ref=e212]:
                  - text: Launched
                  - generic [ref=e213]:
                    - text: Ksolves Product Store; Dashboard
                    - text: Ninja
                  - text: "became the #1 Odoo App."
              - generic [ref=e214]:
                - heading "2020" [level=4] [ref=e215]
                - paragraph [ref=e216]:
                  - text: Launched
                  - generic [ref=e217]:
                    - text: IPO on NSE (one of India's largest
                    - text: stock exchanges).
              - generic [ref=e218]:
                - heading "2021" [level=4] [ref=e219]
                - paragraph [ref=e220]:
                  - text: Achieved CMMI Level 3; grew to
                  - generic [ref=e221]:
                    - text: 350+
                    - text: employees
                  - text: ; featured at Fintech Festival India.
              - generic [ref=e222]:
                - heading "2022" [level=4] [ref=e223]
                - paragraph [ref=e224]:
                  - text: Became
                  - generic [ref=e225]:
                    - text: Salesforce Crest Partner &
                    - text: Odoo Gold Partner; won NASSCOM
                    - text: SME Inspire Award
                  - text: ; expanded to
                  - text: 450+.
              - generic [ref=e226]:
                - heading "2024" [level=4] [ref=e227]
                - paragraph [ref=e228]:
                  - text: Achieved Salesforce Summit Partner status;
                  - text: workforce hit 500+; won
                  - generic [ref=e229]:
                    - text: Deloitte Technology
                    - text: Fast 50
                  - text: ; featured in
                  - generic [ref=e230]:
                    - text: Dun & Bradstreet’s Leading
                    - text: SMEs.
          - generic [ref=e232]:
            - paragraph [ref=e234]: 2025 & Beyond
            - generic [ref=e235]:
              - heading "Shaping the Future" [level=3] [ref=e236]
              - generic [ref=e237]:
                - heading "2025" [level=4] [ref=e238]
                - paragraph [ref=e239]:
                  - text: Won NASSCOM Impact Award; retained
                  - text: Salesforce Summit Partner; named
                  - generic [ref=e240]:
                    - text: Top
                    - text: Salesforce Consulting Company in
                    - text: Australia
                  - text: ; workforce hit 550+.
              - generic [ref=e241]:
                - heading "2026" [level=4] [ref=e242]
                - paragraph [ref=e243]:
                  - text: Became a Frappe Certified Partner,
                  - text: Great place to work, and
                  - generic [ref=e244]:
                    - text: won Best
                    - text: Odoo Partner India 2025
            - img "No description available" [ref=e245]
      - generic [ref=e247]:
        - generic [ref=e248]: Investors
        - generic [ref=e249]:
          - generic [ref=e250]:
            - generic [ref=e251]: Key Financial Highlights Q3’FY26
            - list [ref=e252]:
              - listitem [ref=e253]: "Revenue from Operations: ₹42.30 cr., showing 6.6% QoQ and 12.2% YoY growth."
              - listitem [ref=e254]: "EBITDA Margin: for Q3 stood at 32.4% vs 30.4% in Q2FY26."
              - listitem [ref=e255]: "Profit After Tax: ₹9.80 crores, a significant 16.5% QoQ growth."
              - listitem [ref=e256]: "EPS: Increased to ₹4.13 from ₹3.54 in Q2FY26."
              - listitem [ref=e257]: "Dividend: The Board has declared an interim dividend of ₹5 per share; cumulative dividend for FY26 stands at Rs.11 per share"
            - generic [ref=e258]:
              - link "Annual Report 2025 No description available" [ref=e259] [cursor=pointer]:
                - /url: /wp-content/uploads/2025/09/Annual-Report-2025.pdf
                - generic [ref=e260]: Annual Report
                - generic [ref=e261]:
                  - generic [ref=e262]: "2025"
                  - img "No description available" [ref=e264]
              - link "News Ksolves Surfaces as an Industry Grade Software Development Organization No description available" [ref=e265] [cursor=pointer]:
                - /url: https://www.mid-day.com/brand-media/article/ksolves-surfaces-as-an-industry-grade-software-development-organization-23207189
                - generic [ref=e266]: News
                - generic [ref=e267]:
                  - generic [ref=e268]:
                    - text: Ksolves Surfaces as an Industry Grade
                    - text: Software Development Organization
                  - img "No description available" [ref=e270]
          - img "No description available" [ref=e272]
      - generic [ref=e274]:
        - generic [ref=e275]: Meet Our Management
        - generic [ref=e276]: Meet the Visionaries Behind Our Success
        - generic [ref=e277]:
          - generic [ref=e278]:
            - generic [ref=e279]:
              - img "CEO" [ref=e280]
              - link "No description available" [ref=e281] [cursor=pointer]:
                - /url: https://www.linkedin.com/in/ratan-srivastava-5ab571137
                - img "No description available" [ref=e282]
            - generic [ref=e283]:
              - generic [ref=e284]: Ratan Srivastava
              - generic [ref=e285]: Founder and CEO
              - generic [ref=e286]: 18+ Years IT Experience
          - generic [ref=e287]:
            - generic [ref=e288]:
              - img "No description available" [ref=e289]
              - link "No description available" [ref=e290] [cursor=pointer]:
                - /url: https://www.linkedin.com/in/gurnanim
                - img "No description available" [ref=e291]
            - generic [ref=e292]:
              - generic [ref=e293]: Manish Gurnani
              - generic [ref=e294]: Chief Technology Officer (CTO)
              - generic [ref=e295]: 22+ Years IT Experience
          - generic [ref=e296]:
            - generic [ref=e297]:
              - img "No description available" [ref=e298]
              - link "No description available" [ref=e299] [cursor=pointer]:
                - /url: https://www.linkedin.com/in/aseemkumar
                - img "No description available" [ref=e300]
            - generic [ref=e301]:
              - generic [ref=e302]: Aseem Kumar
              - generic [ref=e303]: Director of Program and Operations
              - generic [ref=e304]: 18+ Years of Experience
          - generic [ref=e305]:
            - generic [ref=e306]:
              - img "No description available" [ref=e307]
              - link "No description available" [ref=e308] [cursor=pointer]:
                - /url: https://www.linkedin.com/in/umangsonijain-ca
                - img "No description available" [ref=e309]
            - generic [ref=e310]:
              - generic [ref=e311]: Umang Soni
              - generic [ref=e312]: Chief Financial Officer
              - generic [ref=e313]: 10+ Years of Experience
          - generic [ref=e314]:
            - generic [ref=e315]:
              - img "No description available" [ref=e316]
              - link "No description available" [ref=e317] [cursor=pointer]:
                - /url: https://www.linkedin.com/in/manisha-kide-951753192
                - img "No description available" [ref=e318]
            - generic [ref=e319]:
              - generic [ref=e320]: Manisha Kide
              - generic [ref=e321]: Company Secretary and Compliance Officer
              - generic [ref=e322]: 18+ Years IT Experience
          - generic [ref=e323]:
            - generic [ref=e324]:
              - img "No description available" [ref=e325]
              - link "No description available" [ref=e326] [cursor=pointer]:
                - /url: https://www.linkedin.com/in/ramesh-shinde-9aa902b
                - img "No description available" [ref=e327]
            - generic [ref=e328]:
              - generic [ref=e329]: Ramesh Shinde
              - generic [ref=e330]: Delivery Head
              - generic [ref=e331]: 18+ Years IT Experience
      - generic [ref=e333]:
        - generic [ref=e334]:
          - generic [ref=e335]: Award and Recognition
          - heading "Define the Journey of Ksolves Achievements and Success" [level=2] [ref=e336]
        - generic [ref=e337]:
          - generic [ref=e338]:
            - img "CMMI" [ref=e339]
            - generic [ref=e340]: CMMI
          - generic [ref=e341]:
            - img "Red Hat" [ref=e342]
            - generic [ref=e343]: Red Hat
          - generic [ref=e344]:
            - img "Publicly Listed On" [ref=e345]
            - generic [ref=e346]:
              - text: Publicly Listed On
              - text: NSE and BSE
          - generic [ref=e347]:
            - img "Salesforce Summit(Platinum) Partner" [ref=e348]
            - generic [ref=e349]: Salesforce Summit(Platinum) Partner
          - generic [ref=e350]:
            - img "Top Developers" [ref=e351]
            - generic [ref=e352]: Top Developers
          - generic [ref=e353]:
            - img "Odoo Gold Partner" [ref=e354]
            - generic [ref=e355]: Odoo Gold Partner
          - generic [ref=e356]:
            - img "ISV Salesforce Partner" [ref=e357]
            - generic [ref=e358]: ISV Salesforce Partner
          - generic [ref=e359]:
            - img "Top Salesforce Partner" [ref=e360]
            - generic [ref=e361]: Frappe Certified Partner
      - generic [ref=e364]:
        - generic [ref=e365]:
          - generic [ref=e366]:
            - text: Global Presence,
            - text: Local Commitment.
          - generic [ref=e367]:
            - generic [ref=e368]:
              - generic [ref=e369]:
                - img "No description available" [ref=e371]
                - generic [ref=e372]: India
              - list [ref=e373]:
                - listitem [ref=e374]:
                  - generic [ref=e375]:
                    - link "Noida" [ref=e377] [cursor=pointer]:
                      - /url: https://maps.app.goo.gl/RCMqR1u2wnoADuXK6
                    - text: "|"
                    - link "Indore" [ref=e379] [cursor=pointer]:
                      - /url: https://maps.app.goo.gl/e6JwXkWNKZyaa38EA
                    - text: "|"
                    - link "Pune" [ref=e381] [cursor=pointer]:
                      - /url: https://maps.app.goo.gl/R24HDprG5mhMvSsy8
                - listitem [ref=e382]:
                  - link "1800 121 0218" [ref=e383] [cursor=pointer]:
                    - /url: tel:+91 1800 121 0218
                - listitem [ref=e384]:
                  - link "sales@ksolves.com" [ref=e385] [cursor=pointer]:
                    - /url: mailto:sales@ksolves.com
            - generic [ref=e386]:
              - generic [ref=e387]:
                - img "No description available" [ref=e389]
                - generic [ref=e390]: USA
              - list [ref=e391]:
                - listitem [ref=e392]:
                  - link "San Jose" [ref=e395] [cursor=pointer]:
                    - /url: https://www.google.com/maps/place/Ksolves/@37.3379614,-121.8941323,17z/data=!3m2!4b1!5s0x808fc9525c470157:0xc16fc38a9adf4af6!4m6!3m5!1s0x808fcd4878a26e77:0x6851f00b1efad499!8m2!3d37.3379614!4d-121.8941323!16s%2Fg%2F11j8rlfqwn?entry=tts
                - listitem [ref=e396]:
                  - link "+1 (646) 203-1075" [ref=e397] [cursor=pointer]:
                    - /url: "tel: +1 (646) 203-1075"
                - listitem [ref=e398]:
                  - link "sales@ksolves.com" [ref=e399] [cursor=pointer]:
                    - /url: mailto:sales@ksolves.com
            - generic [ref=e400]:
              - generic [ref=e401]:
                - img "No description available" [ref=e403]
                - generic [ref=e404]: Dubai
              - list [ref=e405]:
                - listitem [ref=e406]:
                  - link "Dubai" [ref=e409] [cursor=pointer]:
                    - /url: https://www.google.com/maps/place/Kingpin+Technology+Consultants+LLC/@25.1884122,55.2666455,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f69813139b28f:0x538116966a9620d6!8m2!3d25.1884074!4d55.2715164!16s%2Fg%2F11xclmtc8s?entry=tts&g_ep=EgoyMDI1MDUxNS4xIPu8ASoASAFQAw%3D%3D&skid=60295d74-57fe-4fe3-a924-9bca5511316d
                - listitem [ref=e410]:
                  - link "+971 551395627" [ref=e411] [cursor=pointer]:
                    - /url: "tel: +971 551395627"
                - listitem [ref=e412]:
                  - link "sales@ksolves.com" [ref=e413] [cursor=pointer]:
                    - /url: mailto:sales@ksolves.com
        - generic [ref=e415]:
          - generic [ref=e416]: Request a call back
          - generic [ref=e418]:
            - generic [ref=e419]:
              - generic [ref=e420]: Name*
              - textbox "Name*" [ref=e421]:
                - /placeholder: Full Name
            - generic [ref=e422]:
              - generic [ref=e423]: Email*
              - textbox "Email*" [ref=e424]:
                - /placeholder: Email Address
            - generic [ref=e425]:
              - generic [ref=e426]: Phone Number*
              - generic [ref=e428]:
                - generic:
                  - 'generic "United States: +1"'
                - textbox "Phone Number*" [ref=e431]:
                  - /placeholder: ""
                  - text: "+1"
            - generic [ref=e432]:
              - generic [ref=e433]: Message*
              - textbox "Message*" [ref=e434]:
                - /placeholder: Message
            - generic [ref=e436]:
              - generic [ref=e437]:
                - text: What is
                - generic [ref=e438]: "3"
                - text: +
                - generic [ref=e439]: "3"
                - text: "?"
                - generic [ref=e440]: "*"
                - link "icon" [ref=e441] [cursor=pointer]:
                  - /url: javascript:void(0);
                  - img "icon" [ref=e442]
              - spinbutton [ref=e444]
            - generic [ref=e445]:
              - button "Submit" [disabled]
    - generic [ref=e448]:
      - img "img" [ref=e450]
      - img "img" [ref=e452]
      - img "img" [ref=e454]
      - img "img" [ref=e456]
      - img "img" [ref=e458]
      - img "img" [ref=e460]
      - img "img" [ref=e462]
  - contentinfo [ref=e463]:
    - generic [ref=e464]:
      - generic [ref=e466]:
        - generic [ref=e467]:
          - generic [ref=e468]:
            - img "Ksolves logo" [ref=e469]
            - paragraph [ref=e471]: Ksolves India Limited is a leading Software Development Company dedicated to working on cutting-edge technologies like Big Data, Machine Learning, Salesforce®, Odoo, etc. With a team of 550+ developers and architects, we are consistently delivering innovative and customized software solutions that drive growth, efficiency, and success for our client’s businesses. With our outstanding IT services and solutions, we have earned the unwavering trust of clients spanning the globe.
            - generic [ref=e472]: Get in Touch With Us
            - generic [ref=e473]:
              - img "phone" [ref=e474]
              - link "1800 121 0218" [ref=e475] [cursor=pointer]:
                - /url: tel:+911800 121 0218
              - generic [ref=e476]: ","
              - link "+1 (646) 203-1075" [ref=e477] [cursor=pointer]:
                - /url: tel:+1 (646) 203-1075
              - generic [ref=e478]: ","
              - link "+971 551395627" [ref=e479] [cursor=pointer]:
                - /url: tel:+971 551395627
            - link "investors+91 8527471031" [ref=e481] [cursor=pointer]:
              - /url: https://api.whatsapp.com/send?phone=+918527471031&text=Hello, I Need Help!
              - img "investors" [ref=e482]
              - text: +91 8527471031
            - generic [ref=e483]:
              - img "mail" [ref=e484]
              - link "sales@ksolves.com" [ref=e485] [cursor=pointer]:
                - /url: mailto:sales@ksolves.com
          - generic [ref=e486]:
            - generic [ref=e487]: Services
            - navigation [ref=e488]:
              - list [ref=e489]:
                - listitem [ref=e490]:
                  - link "AI & ML" [ref=e491] [cursor=pointer]:
                    - /url: /ai-ml-services
                - listitem [ref=e492]:
                  - link "Big Data" [ref=e493] [cursor=pointer]:
                    - /url: /big-data-consulting-company
                - listitem [ref=e494]:
                  - link "Salesforce" [ref=e495] [cursor=pointer]:
                    - /url: /salesforce-services
                - listitem [ref=e496]:
                  - link "Odoo" [ref=e497] [cursor=pointer]:
                    - /url: /odoo-development-company
                - listitem [ref=e498]:
                  - link "DevOps" [ref=e499] [cursor=pointer]:
                    - /url: /devops-consulting-services
                - listitem [ref=e500]:
                  - link "Databricks" [ref=e501] [cursor=pointer]:
                    - /url: /databricks-consulting-services
                - listitem [ref=e502]:
                  - link "Snowflake" [ref=e503] [cursor=pointer]:
                    - /url: /snowflake-consulting-services
                - listitem [ref=e504]:
                  - link "RFP Consulting" [ref=e505] [cursor=pointer]:
                    - /url: /request-for-proposal
          - generic [ref=e506]:
            - generic [ref=e507]: Quick Links
            - list [ref=e509]:
              - listitem [ref=e510]:
                - link "Blogs" [ref=e511] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e512]:
                - link "Ksolves Store" [ref=e513] [cursor=pointer]:
                  - /url: https://store.ksolves.com/
              - listitem [ref=e514]:
                - link "CSR Initiatives" [ref=e515] [cursor=pointer]:
                  - /url: /csr-initiatives
              - listitem [ref=e516]:
                - link "Site Map" [ref=e517] [cursor=pointer]:
                  - /url: /sitemap
              - listitem [ref=e518]:
                - link "About Us" [ref=e519] [cursor=pointer]:
                  - /url: /about-us-ksolves
              - listitem [ref=e520]:
                - link "Investors" [ref=e521] [cursor=pointer]:
                  - /url: /investors
              - listitem [ref=e522]:
                - link "Culture" [ref=e523] [cursor=pointer]:
                  - /url: /life-at-ksolves
              - listitem [ref=e524]:
                - link "Careers We are Hiring" [ref=e525] [cursor=pointer]:
                  - /url: /careers
                  - text: Careers
                  - superscript: We are Hiring
              - listitem [ref=e526]:
                - link "Contact Us" [ref=e527] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e528]: Global Presence
        - generic [ref=e529]:
          - generic [ref=e530]:
            - img "india gate" [ref=e531]
            - generic [ref=e532]:
              - paragraph [ref=e533]: India
              - list [ref=e534]:
                - listitem [ref=e535]:
                  - img "location" [ref=e536]
                  - text: Noida
                - listitem [ref=e537]:
                  - img "location" [ref=e538]
                  - text: Pune
                - listitem [ref=e539]:
                  - img "location" [ref=e540]
                  - text: Indore
          - generic [ref=e541]:
            - img "statue of liberty" [ref=e542]
            - list [ref=e544]:
              - listitem [ref=e545]: USA
              - listitem [ref=e546]:
                - img "usa" [ref=e547]
                - text: Wyoming
          - generic [ref=e548]:
            - img "statue of liberty" [ref=e549]
            - list [ref=e551]:
              - listitem [ref=e552]: UAE
              - listitem [ref=e553]:
                - img "usa" [ref=e554]
                - text: Dubai
        - generic [ref=e555]: Follow Us
        - list [ref=e556]:
          - listitem [ref=e557]:
            - link "Go to Homepage" [ref=e558] [cursor=pointer]:
              - /url: https://www.facebook.com/people/Ksolves/100063995947513/
              - img "icons" [ref=e559]
          - listitem [ref=e560]:
            - link "Go to Homepage" [ref=e561] [cursor=pointer]:
              - /url: https://twitter.com/_Ksolves
              - img "icons" [ref=e562]
          - listitem [ref=e563]:
            - link "Go to Homepage" [ref=e564] [cursor=pointer]:
              - /url: https://www.instagram.com/_ksolves/
              - img "icons" [ref=e565]
          - listitem [ref=e566]:
            - link "Go to Homepage" [ref=e567] [cursor=pointer]:
              - /url: https://www.linkedin.com/company/ksolves
              - img "icons" [ref=e568]
          - listitem [ref=e569]:
            - link "Go to Homepage" [ref=e570] [cursor=pointer]:
              - /url: https://www.youtube.com/channel/UCplv9V47g9VidekGN6Wp1ew
              - img "icons" [ref=e571]
          - listitem [ref=e572]:
            - link "Go to Homepage" [ref=e573] [cursor=pointer]:
              - /url: https://in.pinterest.com/ksolvesindialimited/
              - img "icons" [ref=e574]
      - generic [ref=e575]:
        - generic [ref=e576]: Have A Project Idea?
        - generic [ref=e579]:
          - generic [ref=e580]:
            - generic [ref=e581]: Name*
            - textbox "Name*" [ref=e582]:
              - /placeholder: Full Name
          - generic [ref=e583]:
            - generic [ref=e584]: Email*
            - textbox "Email*" [ref=e585]:
              - /placeholder: Email Address
          - generic [ref=e586]:
            - generic [ref=e587]: Phone Number*
            - generic [ref=e589]:
              - generic:
                - 'generic "United States: +1"'
              - textbox "Phone Number*" [ref=e592]:
                - /placeholder: ""
                - text: "+1"
          - generic [ref=e593]:
            - generic [ref=e594]: Message*
            - textbox "Message*" [ref=e595]:
              - /placeholder: Message
          - generic [ref=e597]:
            - generic [ref=e598]:
              - text: What is
              - generic [ref=e599]: "8"
              - text: +
              - generic [ref=e600]: "10"
              - text: "?"
              - generic [ref=e601]: "*"
              - link "icon" [ref=e602] [cursor=pointer]:
                - /url: javascript:void(0);
                - img "icon" [ref=e603]
            - spinbutton [ref=e605]
          - generic [ref=e606]:
            - button "Submit" [disabled]
    - generic [ref=e607]:
      - generic [ref=e608]: Copyright 2026© Ksolves.com | All Rights Reserved
      - img "Ksolves USP" [ref=e610]
      - list [ref=e611]:
        - listitem [ref=e612]:
          - link "Sitemap" [ref=e613] [cursor=pointer]:
            - /url: https://www.ksolves.com/sitemap
        - listitem [ref=e614]:
          - link "Privacy Policy" [ref=e615] [cursor=pointer]:
            - /url: https://www.ksolves.com/privacy-policy
        - listitem [ref=e616]:
          - link "Terms and Conditions" [ref=e617] [cursor=pointer]:
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