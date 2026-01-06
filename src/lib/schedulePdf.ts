import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Vite-friendly worker URL
// eslint-disable-next-line import/no-unresolved
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// Vite asset URL
import schedulePdfUrl from '@/assets/snowdown-schedule.pdf?url';
import { events } from '@/data/events';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

let scheduleTextPromise: Promise<string> | null = null;

// Bump to invalidate older cached PDF text after parser improvements
const STORAGE_KEY = 'snowdown_schedule_text_v2';

const collapseWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();

const decodeCommonEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const EVENT_TITLE_NEEDLES = Array.from(new Set(events.map((e) => e.title.toUpperCase())))
  // Avoid false positives where a short title matches normal words inside a paragraph
  .filter((t) => t.length >= 12);

// Hand-corrected full descriptions (from the official PDF) for events where parsing is unreliable.
const MANUAL_FULL_DESCRIPTIONS: Record<string, string> = {
  'Search for the Silver Bullet':
    "Hosted by A & L Coors & Four Corners Broadcasting. Engage your inner Zebulon Pike or Mary Cronin! Hidden somewhere among the cliffs, canyons, mountains, and meadows of La Plata County, the Silver Bullet awaits. Starting Mon, Jan 26, daily clues will be released on RADIO 101.3 FM & KRSJ 100.5 FM. Be creative and innovative in solving these clues; there's only one Silver Bullet and no second place! Registration is not required. Find it first and win $250 cash, glory, and other fabulous prizes! All ages welcome. Must be 21+ to win.",
  'SNOWDOWN Theme Contest':
    "Submit Your Idea for SNOWDOWN 2028! Themes are chosen 2 years in advance and must be unique from themes used in previous years. Please submit your ideas by 5 PM on Sun, Feb 1. Keep it family-friendly and unique from previous themes. Check SNOWDOWN.org to see past themes. All ages welcome!",
  'SNOWDOWN T-Shirt Day':
    "Prepare to make history with the official 2026 SNOWDOWN merch! Purchase your very own themed adornments, posters, and buttons released only once a year! These limited-edition collectibles celebrate 150 years of Colorado statehood. Stop by Magpie's to load up your loot!",
  'Colorado Costume Dance Party':
    "Lace up your dancing boots and get ready to party, it's a hootenanny! Join us at the library for a Colorado Costume Dance Party-a fun, high-energy celebration just for little ones. Come dressed as your favorite Colorado critter, mountain explorer, skier, or hometown hero, and dance the day away to kid-friendly tunes! Ages 9 and under.",
  'The Fetch Quest: Colorado Then and Wow':
    "Colorado history meets SNOWDOWN mischief. In this paw-some Colorado-themed scavenger quest, you'll sniff out clues, dig up hidden history, and explore today's dog-friendly gems. Purchase a Scavenger Hunt Kit from Pet Haus, solve themed riddles to find participating businesses, collect stamps at each stop, and return completed sheets for prizes and raffle entry. The hunt runs through Sat, Jan 31. All proceeds donated to the La Plata County Humane Society. Prize categories include First to Finish, Most Creative Selfie, Least Number of Hints Used, Most Riddles Completed, and Best Social Media Post. All ages welcome!",
  "Bingo at the Bee's":
    "From gold rush fever to bingo fever; it's Bee-Ingo! Test your luck at the Bee's and see if fortune favors you like Colorado's pioneers. All ages welcome!",
  'Outhouse Stuffing':
    "Colorado may be loaded with open spaces, but not during SNOWDOWN outhouse stuffing! The team that pushes and squeezes the most people into the outhouse within 2 minutes, then keeps the door closed for 10 seconds, wins! Participants can sign up as a team or individually to create the largest stuffable team. The only rule is that waivers must be signed. Must be 21+.",
  'Crokinole Doubles Tournament':
    "See FRIDAY, Jan 23, 5 PM for details.",
  "Carver Brewing's Beer Dinner":
    "Better hop to it! What better way to celebrate SNOWDOWN 2026 than with a dinner of sesquicentennial-themed food and Carver's craft beer pairings! Purchase tickets in advance at CarverBrewing.com. Must be 21+.",
  'Scavenger Hunt':
    "The original SNOWDOWN Scavenger Hunt is back! This ain't our first rodeo, but it could be yours. Judging will take place on Fri, Jan 30 at 10 AM. Must be 21+.",
  'Joint Rolling Contest':
    "Colorado and weed go together like skis and snow. Now it's your turn to show off those rolling skills! The Joint Rolling contest (using a non-regulated hemp-based product) will consist of 3 categories: Biggest joint rolled, Fastest joint rolling, and Most stylish joint. Points awarded in each category to crown the SNOWDOWN Joint Rolling Champion. A $50 bar tab, $25 bar tab, and a free drink for 1st, 2nd, and 3rd place. Must be 21+.",
  'Pop Darts Tournament':
    "Join us at The ACT for our Pop Darts tournament! What are Pop Darts? Proof that Durango will make a SNOWDOWN event out of anything. Twelve teams of two compete for a chance to win one of three great prizes awarded to the top 3 teams. Must 21+.",
  'Pinball Tournament':
    "A bona fide pinball tournament sponsored by the International Pinball Flipper Association. Format will be 3 strikes, you're out! The winner? The one who survives the chaos with the most points and the least wrist cramps. Prizes for 1st, 2nd, 3rd, and Best Costume. All ages welcome!",
  'Rocky Mountain Mystics Living Tarot':
    "Spend an evening with the Rocky Mountain Mystics Living Tarot Troupe! Immerse yourself in an interactive performance where each card is brought to life. As with Tarot readings, each performance is different, as the cards pulled by audience members result in a unique, personal reading performed by our troupe of silly mediums. Must be 21+.",
  "Buckin' Mechanical Bullriding Contest":
    "We're bringing a Colorado rodeo tradition indoors with a riding contest more challenging than navigating Red Mountain pass during a blizzard. $250, $100, and $50 cash prizes for 1st, 2nd, and 3rd. Must be 18+.",
  'Mah Jongg Tournament':
    "Colorado might've already been on the map before American Mah Jongg hit the scene in the early 1900s, but recently, the popularity has soared! We'll follow the National Mah Jongg League (NMJL) rules, which use the NMJL card. Bring your 2025 NMJL card, but leave your quarters at home. We will track points and award cash prizes to the winners. Costumes encouraged. Please sign up by 5 PM on Tues, Jan 29. All ages welcome, but you must already know how to play American Mah Jongg.",
  'Name That Tune':
    "From John Denver to today's hits, test your music knowledge in this fast-paced guessing game! Contestants will be given clips of songs to listen to, then asked to identify both the song and the artist. Each correct answer earns one point. Highest point total wins! Sign up 15 minutes before the event starts. Must be 21+.",
  'Cocktails for Conservation':
    "Join us in celebrating 34 years of La Plata Open Space Conservancy at our annual SNOWDOWN fundraiser! Cocktails for Conservation is one of Snowdown's premier events and LPOSC's largest fundraiser. Each ticket include complimentary cocktails, wines, fine foods, local brews, silent auction, and a museum scavenger hunt with prizes! All proceeds from this popular event support LPOSC's work to conserve our cherished landscapes and natural resources. All proceeds support LPOSC's work to conserve our cherished landscapes and natural resources, protecting our unique way of life in Southwest Colorado—then and WOW! Ticket and sponsorship details found at www.lposc.org. Must be 21+.",
  'Connect 4':
    "What starts as a classic game of Connect 4 may turn into an outright Hootenanny. Let's hope, at least. Come one, come all! Must be 21+.",
  'Paint the Peaks & Colorado Trivia':
    "Raise a glass and your paintbrush! Come paint a scenic local mountain range, guided step by step by our instructor. Between brushstrokes, test your knowledge with fun Colorado trivia. No experience needed! Please reserve your spot online on Eventbrite. All ages welcome!",
  'Reel of Fortune':
    "It's Centennial State Theme Week here on the Reel of Fortune! Hosted by Ryan Seabass and Vanna Whitefish. Use your casting arm to spin the Reel (wheel) and solve puzzles unique to Colorful Colorado! 2 people per team with 3 rounds of puzzles and a Bonus Round. Register by Wed, Jan 28. All ages welcome!",
  "Booze N'Beacons":
    "A collision of libations and life-saving skills, incorporating teamwork, knowledge of the downtown bar scene, and skills with an avalanche beacon that will send teams out across Durango in a competition to out-track one another. The goals? Hone your beacon skills and socialize with others in an easy-going, booze-imbued, avalanche burial setting. Teams of 4 people. Sign up by Mon, Jan 26. Must be 21+.",
  'Red Ball Express':
    "Hosted by Rotary Clubs of La Plata County and Alpine Bank. Red Ball Express is a local fundraising event organized by the Rotary Clubs of La Plata County. This is the ultimate game of chance and your opportunity to be a \"high roller\" while supporting your community! You could win $5,000, $2,000, or $1,000 and help local non-profits. Here's your chance to make history and have a ball! Find more information at DurangoRedBall.com. Must be 18+.",
  'Spaghetti Dinner':
    "Pasta la vista, baby! A spaghetti dinner is served before and after the parade or until sold out. Strap on your feedsack! Spaghetti, meatballs, salad, and bread. All ages welcome!",
  'Boomer Hot Dog Show, Gen-X Ski Ballet & Gen-Z/Millenial Rail Jam':
    "From Colorado's pioneering ski towns to today's world-class resorts, we've been pushing the limits on snow for 150 years. Skiers and snowboarders will compete for a spot on the podium, judged on their line, technical ability, style, variety, and overall impression as they ride and glide through the course. Ages 14 and over, with a participant cap of 40. Proceeds benefit local youth Ski and Snowboard Programs. Register online via the DurangoWinterSportsClub.org website. Prizes for the top 3 males and females in each division: 14 - 18 and 18+.",
  'SNOWDOWN Follies Videocast':
    "Did you miss the live show? Here's your chance to catch the Follies on the big screen! It's almost as good as the real thing, at half the price! All tickets will go on sale at 12 pm on Sat, Jan 10th at AnimasCityTheatre.com. Purchase early as they tend to sell out! Must be 21+.",
  'Twister Tournament':
    "Twisters aren't just for the Eastern Plains! Connect the dots with Aria PettyOne in an all-out SNOWDOWN style twister tournament! Prizes are awarded per round, with the grand prize for the last one standing at the finale. Spectators of all ages are welcome, but participants must be 18+.",
  "Battle of the DJ's":
    "Water wars, this is not. You get 30 minutes to impress our esteemed judges and the audience, who will vote for their favorite. Sets must be mixed & performed live. Limited under-21 slots available. Sign up by Wed, Jan 23. Under 18 with a parent allowed until 10 PM. More info can be found on the American Legion website.",
  'Tortilla Slap':
    "¡Atención, amigos y amigas! It's back — the 3rd Annual Tortilla Slap! We've turned up the chaos, added extra spice, and this year's champ scores a custom tortilla cape. Think you've got the huevos to take the crown? Must be 18+.",
  'SNOWDOWN Throwdown':
    "Mountain men and pioneer women have nothing on you. Teams of 2 will race the clock in this endurance SNOWDOWN throwdown! Tackle a 500 m row, power through a 100 ft sled push, and blaze through a 1200 m bike course. Partners can share the workload however they see fit. Teamwork, strategy, and speed are key! Ages 13+.",
  'Kids Pinball Tournament':
    "Calling all young pinball wizards! It's time to grab a slice and show off your skills in our 3-Strike Pinball Tournament. Players go head-to-head in epic pinball battles. Lose a match? That's one strike. Three strikes and you're out! Keep playing, keep scoring, and dodge those strikes! The last kid standing without three strikes is crowned the ultimate Pinball Wizard. Must be under 18.",
  'Snowdown Golf':
    "It's the Colorado Open, SNOWDOWN style. Saddle up for the annual costumed tavern golf shootout, where only the sharpest aim (and the steadiest stride) prevail. High noon marks the first draw. Armed with your own putter and golf ball, you'll duel your way through Durango's finest watering holes. See SNOWDOWN.org for entry details. Must be 21+.",
  'Bloody Mary Contest':
    "Hosted by Star Liquor, this is the event your liver has been waiting for. Fun? You're bloody right! Bring your signature Bloody Mary ingredients. Ice, cups, and vodka will be provided to all our mixologists. The tastiest cocktail and the best presentation (booth and costume) win! See SNOWDOWN.org for entry details. Must be 21+.",
  'SNOWDOWN Chili Cook Off':
    "Step right up to the Chuck Wagon Chili Roundup, where the finest chili cooks in the territory roll into town to show what they've got simmering in their pots. The cookfires and booth fixin' begin at sun-up, 7 AM sharp. At 10:30 AM, the judges ride in for the official tasting. At high noon, tasting cups go on sale, so grab one and mosey your way through the wagons to cast your vote for the People's Choice! Bring your appetite and your frontier spirit! See SNOWDOWN.org for entry details. All ages welcome!",
  "Hobby Horsin' Around for Kids":
    "Saddle up, partners! Grab your trusty hobby horse and race across the DoubleTree corral in our first-ever Steeple Chase showdown for kids. Teams of two will leap over hurdles, dodge waterin' holes, and wrangle through obstacles in a test of speed, agility, and cowboy spirit. Be the first to cross the finish line without losin' yer hat or yer nerve, and ride off as the Steeple Chase Champion! Sign-ups start at 2:30 PM. Ages 3–17.",
  "Hobby Horsin' Around for Adults":
    "Adult version of Hobby Horsin'. No, not like that - get your mind out of the gutter! Must be 21+ to ride this ride. See SATURDAY, Jan 31, 3 PM for more details.",
  'Bar Olympics':
    "Bring your best brewery banter and your most hop-forward costume to Lola's Place for the Ultimate Bar Olympics. Teams will go pint-to-pint in a lineup of classic taproom challenges, think cornhole and a few surprise brewhouse-inspired events. Costumes are encouraged, and bonus points are awarded for creativity. Must be 21+.",
  'Search for the Silver Bullet Awards':
    "See All Week for more details.",
  'Gen Alpha/Beta Railjam':
    "See FRIDAY, Jan 30, 7 PM for more details. Ages 13 and under, with a participant cap of 40.",
  'Battle of the Bands':
    "Crank up the amps and hit the stage for the ultimate Battle of the Bands! You've got 45 minutes to blow the judges away and ignite the crowd. The fans will vote for their favorite act, so make sure your groupies are there to cheer you on. Sign up by Sat, Jan 24. More info on the Durango Legion website. Under 18 with a parent allowed till 10 PM.",
  'Durangotang Glow Dance':
    "Flaunt your favorite Colorado gear for a glow-in-the-dark dance party! Soccer jersey, ski goggles, ballet shoes, bathing suit, whatever represents your favorite part of the Colorado experience! Join us as we dance to some favorite hits under the glow. All ages are welcome, but children must be supervised.",
  "SNOWDOWN Fashion Do's and Dont's":
    "Behold, as our elite models display why Durango was voted \"Worst Dressed Community\" by USA Today. This isn't the boardwalk, honey, it's the catwalk! Strut your stuff like famed Colorado gambler Poker Alice owes you money, and be ready for some bawdy but good-humored entertainment. Doors open at 11 AM. Lunch for seated guests begins at 11:30 AM, and the show starts at 12:30 PM. Cash bar. See SNOWDOWN.org for entry details. Prizes awarded for Best Dressed. Must be 21+.",
  "Cards Against SNOWDOWN":
    "Ready to prove you're the most offensive Coloradan in the room? Join us and play through several rounds of this jaw-dropping, stomach-churning, boundary-shattering card game! We take pride in flaunting that this is no game for the faint of heart. Must be 18+.",
  "Scavenger Hunt Judging":
    "See WEDNESDAY, Jan 28, 12 PM for details.",
  "Best Chest in the West":
    "Step right up, sugar, and strut your stuff in the Best Chest in the West Contest, open to gents and gals alike! Show off your strength, your style, and your finest assets, whether you're a gym regular, a bodybuilder, or just naturally well-endowed. Judges will be looking for presentation, flair, and overall creativity, with extra points for charm, charisma, and confidence. Bring your sass, your sparkle, (and your pasties?) for the win! A $50 bar tab, $25 bar tab, and a free drink for 1st, 2nd, and 3rd place. Must be 21+.",
  "Colorado Then and Wow Chess Tournament":
    "It's a quiet duel at High Noon! Saddle up for a high-stakes showdown where sharp minds meet Rocky Mountain chill. Single-elimination format with 3 competitive categories: 13 and under, 14+ Beginners, and 14+ Advanced. A limited number of chessboards are provided, but if you have a favorite board and/or clock, bring it! You must pre-register for this event by contacting the event coordinator. All ages welcome!",
};

async function extractScheduleText(): Promise<string> {
  const loadingTask = getDocument(schedulePdfUrl);
  const pdf = await loadingTask.promise;

  let out = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // pdf.js text items are either TextItem or TextMarkedContent
    const pageText = (textContent.items as any[])
      .map((it) => (typeof it?.str === 'string' ? it.str : ''))
      .join(' ');

    out += `\n\n${pageText}`;
  }

  return collapseWhitespace(out);
}

export async function loadScheduleText(): Promise<string> {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  if (!scheduleTextPromise) {
    scheduleTextPromise = (async () => {
      const text = await extractScheduleText();
      try {
        localStorage.setItem(STORAGE_KEY, text);
      } catch {
        // ignore storage quota/private mode issues
      }
      return text;
    })();
  }

  return scheduleTextPromise;
}

function findNextEventTitleIndex(upper: string, start: number): number {
  let min = -1;
  for (const title of EVENT_TITLE_NEEDLES) {
    const i = upper.indexOf(title, start);
    if (i !== -1 && (min === -1 || i < min)) min = i;
  }
  return min;
}

export async function getEventFullDescription(params: {
  title: string;
  location: string;
}): Promise<string | null> {
  const manual = MANUAL_FULL_DESCRIPTIONS[params.title];
  if (manual) return manual;

  const text = await loadScheduleText();
  const upper = text.toUpperCase();

  const titleNeedle = params.title.toUpperCase();
  const locNeedle = params.location.toUpperCase();

  let idx = upper.indexOf(titleNeedle);
  while (idx !== -1) {
    const start = idx + titleNeedle.length;

    // Prefer matches where the location appears near the title, but don't require it.
    const locIdx = upper.indexOf(locNeedle, idx);
    const locationIsNear = locIdx !== -1 && locIdx - idx < 900;

    const endCandidates: number[] = [];

    // Best boundary: next event title
    const nextTitleIdx = findNextEventTitleIndex(upper, start + 5);
    // Only use this if it looks like a real "next event" boundary.
    if (nextTitleIdx !== -1 && nextTitleIdx - idx < 5000 && nextTitleIdx - start > 50) {
      endCandidates.push(nextTitleIdx);
    }

    // Fallback boundaries
    endCandidates.push(
      ...[
        upper.indexOf('EVENT COORDINATOR', start),
        upper.indexOf('ENTRY COST', start),
      ].filter((i) => i !== -1)
    );

    if (endCandidates.length) {
      const end = Math.min(...endCandidates);
      const raw = text.slice(start, end);

      let cleaned = decodeCommonEntities(collapseWhitespace(raw));

      // If the extracted block begins with the location (common in PDFs), strip it.
      if (cleaned.toUpperCase().startsWith(locNeedle)) {
        cleaned = cleaned.slice(locNeedle.length).trim();
      }

      // Remove leading separators/punctuation introduced by text extraction.
      cleaned = cleaned.replace(/^[,.;:–—\-\s]+/, '').trim();

      if (cleaned) return cleaned;
    }

    // If this occurrence didn't look right, try the next one.
    idx = upper.indexOf(titleNeedle, idx + titleNeedle.length);

    // If we found a location-near match and still couldn't extract, don't keep searching.
    if (locationIsNear) break;
  }

  return null;
}

