// endpoints.config.js
// ─────────────────────────────────────────────────────────────────────
// Registry of all pages under visual regression test.
// Grouped in the same order as the website's header navigation.
//
// HOW TO ADD A PAGE:
//   1. Add a new object: { id: 'Page-Id', group: 'group', folder: 'folder', path: '/url-path' }
//   2. Run: npm run baseline -- chrome-desktop [Page-Id]
//   3. Run: npm run visual -- chrome-desktop [Page-Id]   (verify it passes)
//
// FIELDS:
//   id     — Used as the screenshot filename and in test names.
//            Use Title Case with hyphens for spaces (e.g. 'About-Us').
//            Must be unique across all entries.
//   group  — Section group for filtering (e.g. npm run visual -- chrome-desktop services).
//            Values: homepage | about-us | services | support-services | products | insights | footer
//   folder — Subdirectory inside the per-project baseline folder.
//            Baselines land at: golden-baselines/{browser}/{device}/{folder}/{id}.png
//   path   — Relative path (e.g. '/about-us') or absolute URL (e.g. 'https://...').
//
// NOTHING ELSE BELONGS HERE. No selectors, no masks, no timeouts.
// ─────────────────────────────────────────────────────────────────────

module.exports = [

  // ── Homepage ──────────────────────────────────────────────────────
  { id: 'Homepage', group: 'homepage', folder: 'homepage', path: '/' },

  // ── About Us ──────────────────────────────────────────────────────
  { id: 'About-Us',        group: 'about-us', folder: 'about-us', path: '/about-us-ksolves' },
  { id: 'Life-at-Ksolves', group: 'about-us', folder: 'about-us', path: '/life-at-ksolves' },
  { id: 'Legacy-Circle',   group: 'about-us', folder: 'about-us', path: '/legacy-circle' },
  { id: 'Careers',         group: 'about-us', folder: 'about-us', path: '/careers' },

  // ── Services ──────────────────────────────────────────────────────
  { id: 'AI-ML-Services',         group: 'services', folder: 'services', path: '/ai-ml-services' },
  { id: 'Big-Data-Consulting',    group: 'services', folder: 'services', path: '/big-data-consulting-company' },
  { id: 'Snowflake-Consulting',   group: 'services', folder: 'services', path: '/snowflake-consulting-services' },
  { id: 'Databricks-Consulting',  group: 'services', folder: 'services', path: '/databricks-consulting-services' },
  { id: 'Salesforce-Services',    group: 'services', folder: 'services', path: '/salesforce-services' },
  { id: 'Odoo-Development',       group: 'services', folder: 'services', path: '/odoo-development-company' },
  { id: 'DevOps-Consulting',      group: 'services', folder: 'services', path: '/devops-consulting-services' },
  { id: 'Request-for-Proposal',   group: 'services', folder: 'services', path: '/request-for-proposal' },
  { id: 'Other-IT-Services',      group: 'services', folder: 'services', path: '/other-it-services' },

  // ── Support Services ──────────────────────────────────────────────
  { id: 'Support-Services',                group: 'support-services', folder: 'support-services', path: '/support-services' },
  { id: 'Apache-NiFi-Support',             group: 'support-services', folder: 'support-services', path: '/support-services/apache-nifi-support' },
  { id: 'Apache-Cassandra-Support',        group: 'support-services', folder: 'support-services', path: '/support-services/apache-cassandra-support' },
  { id: 'Apache-Kafka-Support',            group: 'support-services', folder: 'support-services', path: '/support-services/apache-kafka-support' },
  { id: 'Apache-Spark-Support',            group: 'support-services', folder: 'support-services', path: '/support-services/apache-spark-support' },
  { id: 'Apache-Hadoop-Support',           group: 'support-services', folder: 'support-services', path: '/support-services/apache-hadoop-support' },
  { id: 'Apache-Druid-Support',            group: 'support-services', folder: 'support-services', path: '/support-services/apache-druid-support' },
  { id: 'Apache-Pinot-Support',            group: 'support-services', folder: 'support-services', path: '/support-services/apache-pinot-support' },
  { id: 'Thanos-Support',                  group: 'support-services', folder: 'support-services', path: '/support-services/thanos-support' },
  { id: 'MongoDB-Support',                 group: 'support-services', folder: 'support-services', path: '/support-services/mongodb-support' },
  { id: 'Rook-Ceph-Support',               group: 'support-services', folder: 'support-services', path: '/support-services/rook-ceph-support' },
  { id: 'Prometheus-Enterprise-Support',   group: 'support-services', folder: 'support-services', path: '/support-services/prometheus-enterprise-support' },
  { id: 'Grafana-Consulting',              group: 'support-services', folder: 'support-services', path: '/support-services/grafana-consulting' },
  { id: 'RabbitMQ-Consulting',             group: 'support-services', folder: 'support-services', path: '/support-services/rabbitmq-consulting' },
  { id: 'ZooKeeper-Support',               group: 'support-services', folder: 'support-services', path: '/support-services/zookeeper-support' },
  { id: 'Apache-HBase-Support',            group: 'support-services', folder: 'support-services', path: '/support-services/apache-hbase-support' },
  { id: 'MySQL-Support',                   group: 'support-services', folder: 'support-services', path: '/support-services/mysql-support' },
  { id: 'PostgreSQL-Support',              group: 'support-services', folder: 'support-services', path: '/support-services/postresql-support' }, // note: URL has a typo (postresql) — matches live site
  { id: 'Elasticsearch-Support',           group: 'support-services', folder: 'support-services', path: '/support-services/elasticsearch-support' },
  { id: 'OpenSearch-Support',              group: 'support-services', folder: 'support-services', path: '/support-services/opensearch-support' },
  { id: 'Flink-Support',                   group: 'support-services', folder: 'support-services', path: '/support-services/flink-support' },
  { id: 'Apache-Airflow',                  group: 'support-services', folder: 'support-services', path: '/support-services/apache-airflow' },
  { id: 'Ambari-Consulting-Support',       group: 'support-services', folder: 'support-services', path: '/support-services/ambari-consulting-support' },
  { id: 'BigTop-Consulting-Support',       group: 'support-services', folder: 'support-services', path: '/support-services/bigtop-consulting-support' },
  { id: 'Apache-StreamSets-Consulting',    group: 'support-services', folder: 'support-services', path: '/support-services/apache-streamsets-consulting' },
  { id: 'ClickHouse',                      group: 'support-services', folder: 'support-services', path: '/support-services/clickhouse' },
  { id: 'Trino-Consulting',                group: 'support-services', folder: 'support-services', path: '/support-services/trino-consulting' },
  { id: 'Apache-Hive',                     group: 'support-services', folder: 'support-services', path: '/support-services/apache-hive' },
  { id: 'Apache-Drill',                    group: 'support-services', folder: 'support-services', path: '/support-services/apache-drill' },
  { id: 'Apache-Tez',                      group: 'support-services', folder: 'support-services', path: '/support-services/apache-tez' },
  { id: 'Apache-Superset',                 group: 'support-services', folder: 'support-services', path: '/support-services/apache-superset' },
  { id: 'Dremio',                          group: 'support-services', folder: 'support-services', path: '/support-services/dremio' },
  { id: 'Apache-Iceberg',                  group: 'support-services', folder: 'support-services', path: '/support-services/apache-iceberg' },
  { id: 'Delta-Lake',                      group: 'support-services', folder: 'support-services', path: '/support-services/delta-lake' },
  { id: 'Starburst-Consulting',            group: 'support-services', folder: 'support-services', path: '/support-services/starburst-consulting' },
  { id: 'StarRocks-Consulting',            group: 'support-services', folder: 'support-services', path: '/support-services/starrocks-consulting' },
  { id: 'Hudi-Consulting',                 group: 'support-services', folder: 'support-services', path: '/support-services/hudi-consulting' },

  // ── Products — Odoo ───────────────────────────────────────────────
  { id: 'Dashboard-Ninja-with-AI',            group: 'products', folder: 'products/odoo', path: '/dashboard-ninja-with-ai' },
  { id: 'Access-Manager-Ninja',               group: 'products', folder: 'products/odoo', path: '/access-manager-ninja' },
  { id: 'Hotel-Management',                   group: 'products', folder: 'products/odoo', path: '/hotel-management' },
  { id: 'ReportMate',                         group: 'products', folder: 'products/odoo', path: '/reportmate' },
  { id: 'Ksolves-Cloud',                      group: 'products', folder: 'products/odoo', path: 'https://ksolvescloud.com/' },
  { id: 'Ksolves-Store',                      group: 'products', folder: 'products/odoo', path: 'https://store.ksolves.com/' },
  { id: 'Advanced-Dashboard-Ninja-v18',       group: 'products', folder: 'products/odoo', path: 'https://store.ksolves.com/shop/product/advanced-dashboard-ninja-with-ai-v-18.0' },
  { id: 'Odoo-WooCommerce-Connector',         group: 'products', folder: 'products/odoo', path: 'https://store.ksolves.com/shop/odoo-apps/odoo-woocommerce-connector-106' },
  { id: 'Dynamic-Financial-Report',           group: 'products', folder: 'products/odoo', path: 'https://store.ksolves.com/shop/odoo-apps/dynamic-financial-report-103' },

  // ── Products — Salesforce ─────────────────────────────────────────
  { id: 'Google-Analytics-Connector', group: 'products', folder: 'products/salesforce', path: '/google-analytics-connector' },
  { id: 'Salesforce-CTI-Integration', group: 'products', folder: 'products/salesforce', path: '/salesforce-cti-integration' },
  { id: 'SMS-Ninja',                  group: 'products', folder: 'products/salesforce', path: 'https://www.smsninja.app/' },

  // ── Products — Other ──────────────────────────────────────────────
  { id: 'Mind_AI-Ninja', group: 'products', folder: 'products/other', path: '/mindaininja' },
  { id: 'DFM',           group: 'products', folder: 'products/other', path: 'http://www.dfmanager.com/' },

  // ── Insights — listing pages ──────────────────────────────────────
  { id: 'Case-Studies',           group: 'insights', folder: 'insights', path: '/case-studies' },
  { id: 'Customer-Testimonials',  group: 'insights', folder: 'insights', path: '/customer-testimonials' },
  { id: 'Blog',                   group: 'insights', folder: 'insights', path: '/blog' },
  { id: 'Guides',                 group: 'insights', folder: 'insights', path: '/guides' },
  { id: 'Industries',             group: 'insights', folder: 'insights', path: '/industries' },
  { id: 'Webinar',                group: 'insights', folder: 'insights', path: '/webinar' },
  { id: 'Press-Release',          group: 'insights', folder: 'insights', path: '/press-release' },
  { id: 'Events',                 group: 'insights', folder: 'insights', path: '/events' },
  { id: 'Podcast',                group: 'insights', folder: 'insights', path: '/podcast' },

  // ── Insights — detail pages ───────────────────────────────────────
  { id: 'Case-Study-Patient-Data-Visualization', group: 'insights', folder: 'insights/case-studies', path: '/case-studies/reactjs/patient-data-visualization-portal' },
  { id: 'Blog-Fine-Tuning-LLMs',                 group: 'insights', folder: 'insights/blog',         path: '/blog/artificial-intelligence/race-in-fine-tuning-llms' },
  { id: 'Guide-Agentic-AI-Retail-Ecommerce',     group: 'insights', folder: 'insights/guides',       path: '/guides/agentic-ai-retail-ecommerce' },
  { id: 'Industry-Odoo-Finance',                 group: 'insights', folder: 'insights/industries',   path: '/industries/odoo-finance' },
  { id: 'Webinar-MuleSoft-Manufacturing',        group: 'insights', folder: 'insights/webinar',      path: '/webinar/salesforce/mulesoft-integration-for-manufacturing' },
  { id: 'Press-Release-Agentic-AI-Hackathon',    group: 'insights', folder: 'insights/press-release', path: '/press-release/agentic-ai-hackathon-2026' },
  { id: 'Event-Odoo-Experience',                 group: 'insights', folder: 'insights/events',       path: '/events/odoo-experience' },

  // ── Standalone / Footer pages ─────────────────────────────────────
  { id: 'Investors',            group: 'footer', folder: 'standalone_footer-links', path: '/investors' },
  { id: 'Contact',              group: 'footer', folder: 'standalone_footer-links', path: '/contact' },
  { id: 'CSR-Initiatives',      group: 'footer', folder: 'standalone_footer-links', path: '/csr-initiatives' },
  { id: 'Privacy-Policy',       group: 'footer', folder: 'standalone_footer-links', path: '/privacy-policy' },
  { id: 'Terms-and-Conditions', group: 'footer', folder: 'standalone_footer-links', path: '/terms-and-conditions' },
  { id: 'Cookie-Policy',        group: 'footer', folder: 'standalone_footer-links', path: '/cookie-policy' },
  { id: 'Sitemap',              group: 'footer', folder: 'standalone_footer-links', path: '/sitemap' },

];
