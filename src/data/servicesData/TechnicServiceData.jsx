import { FaTools } from 'react-icons/fa';

const servicesData = [
    {
        id: 1,
        title: 'Teknik Destek',
        slug: 'TechnicalService',
        icon: <FaTools className="text-blue-600 text-4xl mx-auto mb-4" />,
        shortDescription: 'Her marka ve model yazıcı için uzman teknik destek hizmetleri sunuyoruz. İş süreçlerinizin aksamadan devam etmesi için hızlı ve güvenilir çözümlerle yanınızdayız.',
        longDescription: [
            "EOS Teknoloji Hizmetleri olarak, ofisinizdeki iş akışının kesintisiz devam edebilmesi için teknik servis hizmetlerimizi hızlı, güvenilir ve garantili bir şekilde sunuyoruz. Uzman ekibimiz, periyodik bakımdan donanım onarımına, parça değişiminden yazılım güncellemelerine kadar geniş bir yelpazede hizmet vermektedir. Tüm müdahalelerimiz, cihazlarınızın verimliliğini artırmayı ve olası iş kayıplarını en aza indirmeyi hedefler.",
            "Müşteri memnuniyetini esas alan yaklaşımımızla, karşılaşılan sorunları titizlikle analiz eder, kısa sürede kalıcı çözümler üretiriz. Her servis sürecinde detaylı raporlama ve müşteri bilgilendirmesi yaparak şeffaf bir iletişim politikası izleriz. Kurumsal müşterilerimiz için özel olarak hazırlanan bakım anlaşmalarıyla, cihazlarınızın performansını en üst seviyede tutmayı ve beklenmedik arızaların önüne geçmeyi amaçlıyoruz. En karmaşık teknik sorunlara bile kalıcı çözümler üretmek için sürekli kendimizi geliştiriyoruz.",
            "Teknik servis hizmetlerimizle, yazıcılarınızın ömrünü uzatırken, operasyonel verimliliğinizi de maksimize etmenize yardımcı oluyoruz. Ekibimiz, hem yerinde hem de uzaktan destek imkanları sunarak ihtiyaç duyduğunuz her an yanınızda olur.",
            <hr />
        ],
        features: [
            'Yerinde Teknik Servis ve Bakım Hizmeti: Uzman ekibimiz, yerinde müdahale ile sorunlarınızı en hızlı şekilde çözer.',
            'Uzaktan Bağlantı ile Hızlı Arıza Tespiti: Acil durumlarda uzaktan bağlantı ile anında destek sağlayarak çözüm sürecini hızlandırırız.',
            'Orijinal ve Garantili Yedek Parça Kullanımı: Onarımlarda sadece orijinal ve garantili yedek parçalar kullanarak cihazlarınızın ömrünü uzatırız.',
            'Kurumsal Bakım Anlaşmaları: İşletmenizin ihtiyaçlarına özel, önleyici ve koruyucu bakım anlaşmaları ile kesintisiz hizmet güvencesi veririz.',
            'Kapsamlı Raporlama ve Danışmanlık: Her servis işlemi sonrası detaylı raporlama ve teknoloji danışmanlığı sunarız.',
        ],
    },
];

export default servicesData;
