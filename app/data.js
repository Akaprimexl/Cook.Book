export const kateqoriyalar = [
  { ad: 'Şorbalar', ikon: '♨', reng: 'isti' },
  { ad: 'Əsas yeməklər', ikon: '✿', reng: 'esas' },
  { ad: 'Desertlər', ikon: '❋', reng: 'desert' },
  { ad: 'İçkilər', ikon: '◉', reng: 'icki' },
]

export const reseptler = [
  {
    id: 'merci-sorbasi', ad: 'Mərci şorbası', kateqoriya: 'Şorbalar', muddet: '35 dəqiqə',
    tesvir: 'Qırmızı mərci, soğan və yerkökü ilə hazırlanan doyumlu ev şorbası.',
    inqrediyentler: ['1 stəkan qırmızı mərci', '1 soğan', '1 yerkökü', '1 xörək qaşığı tomat pastası', '1,5 litr su', 'Duz, istiot və zeytun yağı'],
    addimlar: ['Soğanı və yerkökünü xırda doğrayıb yağda yumşalana qədər qovurun.', 'Tomat pastasını əlavə edib qarışdırın, yuyulmuş mərcini və suyu tökün.', 'Mərci yumşalana qədər təxminən 25 dəqiqə bişirin.', 'Şorbanı blenderdən keçirin, duz və istiot əlavə edib isti servis edin.'],
  },
  {
    id: 'dovga', ad: 'Dovğa', kateqoriya: 'Şorbalar', muddet: '45 dəqiqə',
    tesvir: 'Göyərti və düyü ilə bişirilən ənənəvi Azərbaycan qatıq şorbası.',
    inqrediyentler: ['1 litr qatıq', '1 yumurta', '2 xörək qaşığı düyü', '1 dəstə keşniş', '1 dəstə şüyüd', '1 dəstə ispanaq', 'Duz'],
    addimlar: ['Qatığı, yumurtanı və düyünü qazanda yaxşıca qarışdırın.', 'Orta odda qaynayana qədər dayanmadan qarışdırın.', 'Xırda doğranmış göyərtini əlavə edib düyü bişənədək qarışdırmağa davam edin.', 'Duz vurub isti və ya soyudulmuş halda süfrəyə verin.'],
  },
  {
    id: 'toyuq-plovu', ad: 'Toyuq plovu', kateqoriya: 'Əsas yeməklər', muddet: '1 saat 10 dəqiqə',
    tesvir: 'Ətirli zəfəranlı düyü və yumşaq toyuqla hazırlanan ailə yeməyi.',
    inqrediyentler: ['2 stəkan basmati düyüsü', '500 q toyuq əti', '2 xörək qaşığı kərə yağı', '1 çimdik zəfəran', 'Duz və istiot'],
    addimlar: ['Düyünü yuyub duzlu suda 20 dəqiqə saxlayın.', 'Toyuğu duz və istiotla bişənədək qaynadın, sonra tikələrə ayırın.', 'Düyünü yarıbişmiş halda süzüb zəfəran dəmləməsi və kərə yağı ilə qazana qaytarın.', 'Düyünü vam odda dəmə qoyun və toyuqla birlikdə servis edin.'],
  },
  {
    id: 'qutab', ad: 'Göyərti qutabı', kateqoriya: 'Əsas yeməklər', muddet: '50 dəqiqə',
    tesvir: 'Nazik xəmirdə təzə göyərti ilə hazırlanan ənənəvi qutab.',
    inqrediyentler: ['3 stəkan un', '1 stəkan ilıq su', '1 dəstə keşniş', '1 dəstə ispanaq', '1 dəstə göy soğan', 'Duz və kərə yağı'],
    addimlar: ['Un, su və duzdan yumşaq xəmir yoğurub 20 dəqiqə dincəldin.', 'Göyərtini doğrayıb az duzla qarışdırın.', 'Xəmiri kündələrə bölüb nazik yayın, yarısına göyərti qoyub bağlayın.', 'Qutabları yağsız tavada hər iki üzü qızarana qədər bişirin və üzərinə kərə yağı çəkin.'],
  },
  {
    id: 'sekerbura', ad: 'Şəkərbura', kateqoriya: 'Desertlər', muddet: '2 saat',
    tesvir: 'Badamlı içliklə hazırlanan, Novruz süfrəsinin sevilən şirniyyatı.',
    inqrediyentler: ['500 q un', '200 q kərə yağı', '1 stəkan süd', '1 yumurta', '200 q üyüdülmüş badam', '150 q şəkər tozu', 'Hil'],
    addimlar: ['İlıq südə maya əlavə edin, sonra yumurta, yağ və unu qatıb xəmir yoğurun.', 'Badamı şəkər tozu və hil ilə qarışdırın.', 'Xəmiri kiçik kündələrə bölüb yayın, içlik qoyub aypara formasında bağlayın.', 'Üzərini maqqaşla bəzəyib 180°C sobada 20–25 dəqiqə bişirin.'],
  },
  {
    id: 'kompot', ad: 'Quru meyvə kompotu', kateqoriya: 'İçkilər', muddet: '30 dəqiqə',
    tesvir: 'Quru meyvələrdən hazırlanan yüngül və ətirli ev içkisi.',
    inqrediyentler: ['200 q quru ərik', '100 q kişmiş', '100 q quru alma', '2 litr su', '3 xörək qaşığı şəkər tozu'],
    addimlar: ['Quru meyvələri yuyub qazana tökün.', 'Üzərinə su əlavə edib qaynamağa qoyun.', 'Vam odda 20 dəqiqə bişirin, zövqə görə şəkər əlavə edin.', 'Soyudub süfrəyə verin.'],
  },
]

function inqrediyentiAyrisdir(metn) {
  const match = metn.match(/^(\d+(?:[,.]\d+)?)\s+(.+)$/)
  if (!match) return { ad: metn, miqdar: null, olcu: '' }
  const miqdar = Number(match[1].replace(',', '.'))
  const qalan = match[2]
  const vahidler = ['xörək qaşığı', 'çay qaşığı', 'stəkan', 'litr', 'qram', 'dəstə', 'ədəd', 'q']
  const olcu = vahidler.find((vahid) => qalan.startsWith(`${vahid} `) || qalan === vahid)
  return olcu
    ? { ad: qalan.slice(olcu.length).trim() || qalan, miqdar, olcu }
    : { ad: qalan, miqdar, olcu: '' }
}

const sekiller = {
  'merci-sorbasi': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85',
  dovga: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85',
  'toyuq-plovu': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=85',
  qutab: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=85',
  sekerbura: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85',
  kompot: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1000&q=85',
}

for (const resept of reseptler) {
  resept.sekil = sekiller[resept.id]
  resept.inqrediyentler = resept.inqrediyentler.map(inqrediyentiAyrisdir)
}
