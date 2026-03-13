import { ImageSourcePropType } from 'react-native';

export type Story = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image?: ImageSourcePropType;
  color: string;
  duration?: string;
};

export const STORIES: Story[] = [
  {
    id: 'famille-1',
    title: 'La Pire Idée de l’Été',
    category: 'famille',
    excerpt: `Quand Abi dit « pas de piscine sur l’herbe », Aliyah et Tarek trouvent une solution… très créative. Une bâche, quelques coussins, beaucoup d’eau… et un chat un peu trop courageux. Le salon ne sera plus jamais le même.,`,
    content: `
Ce jour la il faisait 42°C à l’ombre, même les mouches faisaient la sieste tellement l'air était brûlant.

— Non, non et non ! avait tranché Abi le matin même. Pas de piscine gonflable dans le jardin. Ça jaunit l'herbe, ça attire les moustiques, et c'est du gaspillage en eau. Point final.

Mais Abi avait sous-estimé l'ingéniosité de ses enfants. Dès qu'il fut parti faire les courses, Aliyah réunit son frère Tarek dans le salon.
— Tarek, Abi a dit : "pas sur l'herbe". Il n'a jamais dit : "pas dans le salon".
Tarek ouvrit de grands yeux admiratifs.
— Tu es un maligne, Aliyah !


Les enfants se mirent au travail.

Ils récupérèrent les deux grandes bâches en plastique bleu qu'Abi utilisait pour peindre les murs. Ils les étalèrent sur le tapis du salon (celui qu'Oummi interdit de toucher avec des mains sales).

Pour faire les bords de la piscine, ils utilisèrent tous les coussins du canapé. Pour que ça tienne bien, Aliyah eut l'idée de caler les coussins avec les énormes dictionnaires de la bibliothèque et les livres de sciences religieuses d'Abi et Oummi.

Armés de seaux de plage et de casseroles, ils commencèrent les allez venues entre la cuisine et le salon.

— Plus vite, Tarek ! ordonnait Aliyah. On n'a que 5 centimètres d'eau, on ne peut même pas faire la planche !

Après deux heures d'efforts, ils avaient réussi à créer une "mare" de 10 centimètres de profondeur au beau milieu du salon. C'était magnifique. Ils enfilèrent leurs maillots de bain, mirent leurs masques et leurs tubas, et s'allongèrent dans l'eau tiède en faisant des bruits de baleine.

Mimi le chat observait cette lagune bleue avec une méfiance totale. Pour lui, le salon était devenu un océan dangereux. Mais soudain, il vit une mouche se poser pile au milieu de la bâche.
L'instinct de chasseur fut plus fort que la peur de l'eau. Mimi prit son élan et fit un bond de tigre... PLOUF !

Le chat atterrit en plein milieu de la piscine. Horrifié par l'eau, il entra en mode "panique totale". Ses griffes sortirent.
Scratch... Rip... Shhhh...
Mimi griffa la bâche pour s'extraire de là, créant une dizaine de trous béants avant de s'enfuir dans le couloir en ressemblant à une éponge mouillée.

— Oh non ! La piscine fuit ! hurla Tarek.

L'eau commença à s'infiltrer sous la bâche, aspirée goulûment par le tapis de laine qui se mit à gonfler comme une éponge.

— Vite, Tarek ! Il faut éponger ! cria Aliyah en essayant de retenir l'eau avec ses mains.

Tarek, paniqué, chercha quelque chose de très absorbant. Son regard tomba sur les magnifiques rideaux blancs en lin qu'Oummi venait de faire repasser. Sans réfléchir, il grimpa sur le canapé, tira de toutes ses forces, et les rideaux se décrochèrent dans un bruit de tissu déchiré.
Il les jeta sur le sol et commença à piétiner les rideaux blancs dans l'eau sale et les restes de poussière sous le tapis pour "éponger". Les rideaux devinrent gris instantanément.

C'est à ce moment-là que la clé tourna dans la serrure.
Abi entra, les bras chargés de sacs de courses, suivi par Oummi.

Ils se figèrent.

Aliyah était allongée à plat ventre sur une bâche percée, avec un tuba sur la bouche, faisant semblant de nager dans 2 cm d'eau.

Tarek, était en train de sauter à pieds joints sur les rideaux d'Oummi, qui étaient maintenant marron.

Chaque pas d'Abi sur le tapis déclenchait un bruit de succion : "FLIC-FLAC-SPLOUCH".

— On... on ne gâche pas l'herbe, Abi ! balbutia Aliyah à travers son tuba, la voix toute étouffée.

Ce soir-là, il n'y eut pas de piscine, pas de télé, mais il y eut beaucoup, beaucoup de serpillières et deux enfants qui durent frotter le carrelage jusqu'à minuit sous la surveillance d'un Abi très, très silencieux.`,
    color: '#F59E0B',
    duration: '5 min',
    image: require('@/assets/stories/lafamille.jpg'),
  },
  {
    id: 'famille-2',
    title: 'Où es-tu, Mimi ?',
    category: 'famille',
    excerpt: 'Chaque matin, toute la famille se lève ensemble pour prier avant que le soleil se lève.',
    content: `C’était un vendredi soir d’automne, le genre de soir où le vent siffle doucement contre les carreaux et où l’on a juste envie de rester au chaud à la maison. L’appel à la prière du Maghreb venait de résonner.

Dans la cuisine, une bonne odeur de soupe aux lentilles réchauffait l'atmosphère. Oummi dressait la table.
— Les enfants ! À table ! appela-t-elle.

Tarek déboula dans la cuisine en glissant sur ses chaussettes, comme à son habitude. Il s'assit bruyamment. Aliyah arriva plus calmement, un livre à la main qu'elle posa sur le buffet.
— Bismillah ! s'exclama Tarek en saisissant sa cuillère.

Soudain, il s'arrêta. Son regard se porta vers le coin de la cuisine, près du radiateur. Là où se trouvait le bol bleu de Mimi, le chat persan.
Le bol était plein. Les croquettes n'avaient pas été touchées.

— Tiens ? dit Tarek, la bouche pleine. Où est Mimi? D'habitude, il miaule dès qu'il entend le bruit des cuillères.

Oummi fronça les sourcils.
— C'est vrai. Je ne l'ai pas vu depuis le retour de l'école. Aliyah, tu l'as vu ?
— Non, Oummi. Je pensais qu'il dormait sur le lit de Tarek.

Tarek reposa sa cuillère. Une petite inquiétude, légère comme une plume, vint lui chatouiller le ventre.
— Je vais voir, dit-il en se levant.

Le silence de la maison
Tarek monta les escaliers quatre à quatre.
— Mimi ! Mimi ! Pssst !
Il entra dans sa chambre. Pas de chat sur le lit. Pas de chat sous le bureau. Il regarda dans le panier à linge sale (la cachette préférée de Mimi pour les siestes incognito). Rien.

Il alla dans la chambre d'Aliyah. Rien.
Il vérifia la salle de bain, derrière le rideau de douche. Rien.

Tarek redescendit, moins vite cette fois. Le silence de la maison lui semblait soudainement plus lourd.
— Il n'est pas en haut, annonça-t-il d'une petite voix.

Abi se leva à son tour.
— Ne t'inquiète pas, Tarek. Il s'est peut-être faufilé dans le garage quand j'ai rentré la voiture. Allons voir.

Ils cherchèrent partout. Dans le garage, dans le salon, sous les canapés. Ils ouvrirent la porte d'entrée et appelèrent dans la nuit noire. Le vent froid leur répondit, faisant bougerr les feuilles mortes. Mais pas de miaulement familier. Pas de petite boule de poils soyeuse qui vient frotter ses jambes.

L'angoisse monte
Une heure passa. L'inquiétude de Tarek s'était transformée en une boule dure dans sa gorge. Il ne voulait plus manger. Il tournait en rond dans le salon.

Lui qui, d'habitude, passait son temps à embêter Mimi – à lui faire porter des chapeaux en papier, à lui courir après pour jouer à "chat-perché", ou à l'appeler "Gros Patapouf" – se sentait soudain terriblement coupable.

Il s'imagina Mimi dehors, seul, dans le froid. Il pensa aux voitures qui passaient vite dans la rue voisine. Il pensa aux chiens des voisins.
— C'est de ma faute, chuchota Tarek.
Aliyah, qui l'observait depuis le canapé, s'approcha doucement.
— Pourquoi tu dis ça, Tarek ?
— Parce que ce matin... renifla Tarek, ce matin, je l'ai grondé parce qu'il avait marché sur mes devoirs. Je lui ai dit "Va-t'en, tu m'énerves !". Et si... et s'il était parti parce qu'il croit que je ne l'aime plus ?

Les larmes, que Tarek retenait courageusement depuis tout à l'heure, commencèrent à déborder. Il courut vers la baie vitrée du salon et colla son front contre la vitre froide, scrutant l'obscurité du jardin.

Il pleurait pour de bon, pas des larmes pour avoir un bonbon, mais des larmes chaudes et salées qui venaient du cœur. Il se sentait petit et impuissant. Il réalisa à quel point il aimait cette petite bête silencieuse. Sans Mimi, la maison semblait vide, immense et triste.

Aliyah s'approcha de lui. Elle ne se moqua pas. Elle ne lui fit pas de remarque sarcastique. Elle vit la détresse de son petit frère et son cœur se serra. Elle s'assit par terre, à côté de lui, devant la grande vitre.

— Tarek, dit-elle doucement en posant sa main sur son épaule. Mimi sait que tu l'aimes. Même quand tu l'embêtes, il revient toujours dormir sur tes pieds, non ?
Tarek hocha la tête, incapable de parler.
— Tu sais ce qu'on va faire ? On va demander à Celui qui voit tout et qui entend tout.

Aliyah leva ses mains paumes vers le ciel. Tarek, reniflant bruyamment, l'imita. Ses petites mains tremblaient un peu.

— Ô Allah, Tu es le Protecteur. Protège notre chat Mimi où qu'il soit. Il a froid et il doit avoir peur. Guide-le vers la maison, Ya Allah. Apaise le cœur de Tarek et ramène-nous notre ami.
— Amine, murmura Tarek, la voix brisée. Ya Allah, ramène-le moi. Je promets de ne plus jamais l'embêter, je lui donnerai même ma part de fromage.

Ils restèrent là un moment, assis dans le calme, épaule contre épaule.
— Tu te souviens, dit Aliyah avec un petit sourire triste, la fois où Mimi a essayé d'attraper une mouche et qu'il est tombé dans la baignoire ?
Tarek eut un petit rire mouillé à travers ses larmes.
— Oui... il ressemblait à un rat tout mouillé et furieux.
— Et la fois où il a dormi sur la tête d'Abi pendant sa sieste ?
— Il ronronnait tellement fort qu'on croyait que c'était Abi qui ronflait ! ajouta Tarek.

Se remémorer ces souvenirs apaisa un peu Tarek. Il se sentit moins seul. Il savait qu'il avait fait la chose la plus importante : il avait placé sa confiance en Allah.

Soudain, au milieu du silence, un bruit se fit entendre.
Crac. Scroutch. Cromch.

Tarek se figea.
— Tu as entendu ?
— Ça vient de la cuisine, chuchota Aliyah.

Tarek se leva d'un bond, essuyant ses joues d'un revers de manche. Ils marchèrent sur la pointe des pieds vers la cuisine. La lumière était éteinte.
Cromch. Cromch. Burp.

Le bruit venait du placard du bas. Celui... des réserves de gâteaux.
Le cœur de Tarek battait à tout rompre. Il s'approcha de la porte du placard. Il posa sa main sur la poignée.
Un, deux, trois !

Il ouvrit la porte grand.

La lumière du couloir éclaira l'intérieur du placard.
Là, assis confortablement au milieu d'un paquet de biscuits au beurre, se trouvait Mimi.
Il avait des miettes partout : sur ses moustaches, sur ses sourcils, et même collées sur son petit nez humide. Il avait l'air repu, gros et totalement satisfait de lui-même.

Il cligna des yeux, aveuglé par la lumière, regarda Tarek, et lâcha un petit :
— Miaou ? (Traduction approximative : "Tu peux fermer la porte ? On mange, ici.")

Tarek resta bouche bée une seconde, puis il éclata de rire. Un rire de soulagement, nerveux, joyeux.
— Mimi !

Tarek se jeta presque dans le placard pour serrer le chat dans ses bras, ne se souciant même pas des miettes de biscuits qui se collaient à son pyjama. Il enfouit son visage dans la fourrure douce du chat.
— J'ai cru que je t'avais perdu !

Aliyah, appuyée contre le cadre de la porte, croisa les bras avec un sourire amusé.
— Eh bien, monsieur Tarek... on dirait qu'Allah a exaucé ta Doua très vite. Mais dis-moi... qui a laissé la porte du placard mal fermée après avoir pris le goûter tout à l'heure ?

Tarek releva la tête, serrant toujours Mimi contre lui. Il devint tout rouge. C'était lui. Il avait cherché des biscuits en rentrant de l'école et, pressé de retourner jouer, il n'avait pas clipsé la porte. Mimi, curieux et gourmand, s'était faufilé à l'intérieur et la porte s'était refermée sur lui.

Oummi et Abi arrivèrent dans la cuisine, attirés par le bruit.
— On l'a retrouvé ! cria Tarek. Il était en train de voler nos gâteaux !

Oummi soupira en voyant le désastre des miettes, mais elle sourit en voyant le visage rayonnant de son fils.
— Alhamdulillah, dit-elle.

Tarek regarda Mimi, qui essayait de lécher une miette sur son oreille.
— Bon, dit Tarek en reprenant son air de grand frère sérieux (mais avec les yeux encore rouges), tu es puni de câlins forcés pendant une semaine, Mimi. Et tu me dois un paquet de gâteaux.

Mimi bâilla, indifférent, et posa sa tête sur l'épaule de Tarek. Tout était rentré dans l'ordre. Et ce soir-là, Tarek comprit que même quand on fait le dur, il n'y a aucune honte à avoir un cœur tendre.`,
    color: '#3B82F6',
    duration: '10 min',
  },

  {
    id: 'famille-3',
    title: 'Le Plus Beau Cadeau pour Oummi',
    category: 'famille',
    excerpt: 'Tarek entend sa maman dire qu’elle est épuisée. Alors, au milieu de la nuit, il décide de lui préparer une surprise : un délicieux gâteau au chocolat.',
    content: `Après une journée particulièrement épuisante. Oummi avait couru partout :les courses, le ménage, le repas et les devoirs d'Aliyah. En s'asseyant enfin sur le canapé après le dîner, elle avait laissé échapper un long soupir.
— Je suis tellement fatiguée que je pourrais dormir sur place, avait-elle murmuré en se frottant les yeux.

Dans son coin, Tarek, avait tout entendu. Pour lui, les mots d'Oummi n'étaient pas juste une phrase en l'air. C'était un appel au secours.
Il prit une grande décision : demain, Oummi dormirait comme une reine. C’était lui, Tarek, qui allait préparer le plus grand, le plus beau et le plus délicieux des petits-déjeuners.

À 3 heures du matin, alors que toute la maison était plongée dans un silence absolu, Tarek ouvrit les yeux. Il enfila ses chaussons sans faire le moindre bruit et se glissa hors de sa chambre, tel un petit chat en pyjama.

Il arriva dans la cuisine, alluma la petite lumière au-dessus de la cuisinière, et se mit au travail. Son plan : un gâteau au chocolat géant pour redonner des forces à sa maman.

Mais la cuisine, la nuit, c’est compliqué quand on est un petit enfant.
D’abord, le paquet de farine était rangé trop haut. Tarek monta sur une chaise, attrapa le paquet, mais il était mal fermé... Pouf ! Une avalanche de poudre blanche lui tomba sur la tête et recouvrit le carrelage. La cuisine ressemblait soudain à un paysage de neige.
— Ce n'est pas grave, chuchota Tarek en s'essuyant le nez. La farine, ça s'aspire.

Ensuite, il y eut l'épreuve des œufs. Tarek voulait en casser quatre, comme Oummi. Mais les coquilles glissaient entre ses doigts. Le premier œuf tomba par terre (Splat !). Le deuxième s'écrasa sur le plan de travail. Les deux autres finirent dans le saladier, mais avec beaucoup, beaucoup de morceaux de coquille.

Puis vint le chocolat. Tarek fit fondre une tablette au micro-ondes. Mais le bol était brûlant ! En le sortant, il s'en mit plein les doigts. Paniqué à l'idée de salir son pyjama propre, il chercha un torchon... qu'il ne trouva pas. Il essuya donc ses petites mains pleines de chocolat collant sur le tissu le plus proche : les beaux rideaux blancs de la cuisine.

Tarek transpirait. Et soudain... en voulant attraper le fouet en métal, son coude heurta une casserole posée sur le bord.
BAAAAM ! CLANG ! BOUM !
La casserole tomba sur le carrelage dans un fracas qui résonna dans toute la maison endormie.

Dix secondes plus tard, la lumière principale de la cuisine s'alluma brusquement, aveuglant Tarek.
Oummi se tenait dans l'encadrement de la porte. Ses cheveux étaient ébouriffés, ses yeux grands ouverts par le choc du réveil brutal.

Elle regarda le sol blanc de farine, les œufs écrasés qui coulaient sous la table, les traces de doigts marron sur ses rideaux, et enfin Tarek, figé au milieu, couvert de pâte collante, tenant une cuillère en bois.

La fatigue accumulée de la journée, le stress du réveil en sursaut... Oummi perdit patience.
— Tarek ! s'écria-t-elle, la voix vibrante de colère. Mais c'est n'importe quoi ! Regarde cet état !
Tarek sursauta, la cuillère tremblant dans sa main.
— Je n'en peux plus, tu ne peux pas rester tranquille, même la nuit ?! continua Oummi, dépassée par le chaos. Va te coucher ! TOUT DE SUITE !

Pour Oummi, c'était un cri de fatigue. Mais pour Tarek, ces mots frappèrent son petit cœur comme des flèches de glace.

Il baissa la tête instantanément. Sa gorge se noua si fort qu'il eut l'impression d'avaler une pierre. Il ne dit pas un mot. Il ne se justifia pas. Il posa doucement la cuillère en bois sur la table et marcha vers sa chambre, la tête rentrée dans les épaules. Chaque pas pesait une tonne.

Il ferma la porte de sa chambre dans le noir. Il se glissa sous sa couette, se recroquevillant en petite boule.
Dans sa tête, les mots d'Oummi tournaient en boucle : "C'est n'importe quoi... Va te coucher..."
Il se sentait rejeté. Abandonné.
« Je suis une catastrophe vivante, » pensa-t-il, le cœur broyé. « Je voulais l'aider pour qu'elle soit heureuse, et je l'ai mise en colère. Je fais tout de travers. »

Les larmes montèrent. De grosses larmes chaudes et salées qui coulaient sur son nez et mouillaient son oreiller. Mais Tarek refusait de faire le moindre bruit. Il avait tellement peur de déranger encore plus qu'il gardait la bouche fermée, pleurant en silence, le corps secoué de petits hoquets muets dans l'obscurité totale. Il n'y a rien de plus triste que le chagrin silencieux d'un enfant qui pense avoir déçu la personne qu'il aime le plus.

Pendant ce temps, dans la cuisine, Oummi avait commencé à passer l'éponge sur le sol. Mais en ramassant la cuillère en bois, elle vit le saladier. À côté, il y avait un petit mot écrit au feutre maladroit sur un bout de papier plein de farine : "Pour la rène Oummi repause toi".

Oummi s'arrêta net. Son cœur de maman se serra terriblement. La colère disparut instantanément, remplacée par une immense culpabilité. Son petit garçon n'avait pas fait une bêtise pour s'amuser. Il avait fait cela par pur amour pour elle. Et elle avait crié.

Elle laissa l'éponge et marcha rapidement vers la chambre de Tarek.
Elle ouvrit la porte doucement. Elle entendit les petits reniflements étouffés sous la couette.

Oummi s'assit sur le bord du lit. Le matelas s'enfonça doucement. Elle tira délicatement la couverture pour dévoiler le visage inondé de larmes de Tarek.
— Mon chéri... murmura-t-elle, la voix pleine de douceur et de regrets.

Tarek n'osa pas la regarder. Il gardait les yeux fermés.
Oummi se pencha et l'enveloppa dans ses bras, le serrant très fort contre elle.
— Tarek, pardonne-moi, chuchota-t-elle en embrassant ses cheveux poudrés de farine. Je n'aurais jamais dû crier. Oummi était juste fatiguée et surprise par le bruit. Je n'étais pas fâchée contre toi, j'étais fâchée contre le désordre.

Tarek ouvrit un œil, la lèvre inférieure toujours tremblante.
— Je voulais... je voulais faire le gâteau pour que tu dormes demain... sanglota-t-il enfin, sa petite voix brisée par le chagrin. Mais j'ai cassé les œufs... je suis nul.
— Tu n'es pas nul, le coupa Oummi en lui essuyant les joues avec son pouce. Tu as le cœur le plus magnifique. Ce gâteau, même s'il n'est pas cuit, c'est le plus beau cadeau du monde. Ton intention était parfaite.

Tarek sentit la lourde pierre dans sa poitrine fondre comme de la neige au soleil. Le lien n'était pas cassé. Oummi l'aimait toujours. Il s'agrippa au pyjama de sa maman et pleura un bon coup, mais cette fois-ci, c'étaient des larmes de soulagement.

— D'ailleurs... ajouta Oummi avec un petit sourire complice dans la pénombre.
Elle sortit de la poche de sa robe de chambre un gros morceau de la tablette de chocolat que Tarek avait entamée dans la cuisine.
— Je crois qu'il nous reste un bout du petit-déjeuner à goûter, non ?

Tarek renifla, un petit sourire apparaissant enfin sur son visage barbouillé.
Assis dans le lit, dans le noir de la nuit, à 3h30 du matin, Tarek et Oummi mangèrent leur carré de chocolat ensemble. Le goût était sucré, réconfortant, et balaya toute la tristesse. La cuisine attendrait demain pour être nettoyée. Pour l'instant, le plus important était réparé.
`,
    color: '#10B981',
    duration: '9 min',
  },
];
