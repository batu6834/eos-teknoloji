import { FaServer } from 'react-icons/fa';

const servicesData = [
    {
        id: 3,
        title: 'Sunucu ve Depolama Sistemleri',
        slug: 'ServerStorage',
        icon: <FaServer className="text-blue-600 text-4xl mx-auto mb-4" />,
        shortDescription: 'Güçlü sunucu altyapısı ve güvenli veri depolama çözümleri...',
        longDescription: [
            "EOS Teknoloji Hizmetleri olarak, işletmenizin BT altyapısını güvenilir ve ölçeklenebilir sistemlerle güçlendiriyoruz. Hızla artan veri ihtiyaçlarına ve değişen iş gereksinimlerine uygun olarak tasarladığımız çözümlerle, operasyonel verimliliğinizi ve rekabet gücünüzü artırmayı hedefliyoruz.",
            "İşletmenizin özel ihtiyaçlarına göre, hem fiziksel hem de sanal sunucu kurulumları gerçekleştiriyoruz. Bu çözümlerle, bütçenizden bağımsız olarak en yüksek performansı ve esnekliği sunmayı amaçlıyoruz. Ayrıca, olası bir kesinti durumunda iş süreçlerinizin aksamaması için yüksek erişilebilirlik ve veri yedekleme çözümlerini de entegre ediyoruz.",
            "Veri merkezlerinizin performansını artırmak için depolama sistemleri, yedeklilik yapıları ve uçtan uca güvenlik protokolleri ile kapsamlı çözümler geliştiriyoruz. EOS Teknoloji Hizmetleri'nin uzmanlığı sayesinde, verilerinizin güvenliğini sağlarken, aynı zamanda veri erişim hızınızı ve yönetim kolaylığınızı da optimize ediyoruz.",
            <hr />
        ],
        features: [
            'Fiziksel ve sanal sunucu kurulumları: İşletmenizin ihtiyaçlarına göre optimize edilmiş sunucu altyapıları kurarak, performansı ve esnekliği en üst düzeye çıkarıyoruz.',
            'Veri merkezi optimizasyonu: Mevcut veri merkezlerinizin performansını, enerji verimliliğini ve soğutma sistemlerini analiz ederek daha verimli hale getiriyoruz.',
            'Yüksek erişilebilirlik ve yedeklilik sistemleri: Kritik verilerinizin ve uygulamalarınızın sürekli erişilebilir olması için yedekli ve kesintisiz çalışan sistemler entegre ediyoruz.',
            'Gelişmiş veri yedekleme ve güvenlik çözümleri: Siber tehditlere ve veri kayıplarına karşı işletmenizi korumak için en güncel veri yedekleme, kurtarma ve güvenlik protokollerini uyguluyoruz.',
        ],
    },
];

export default servicesData;
