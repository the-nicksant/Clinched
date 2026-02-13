/**
 * Sherdog Scraper
 *
 * Scrapes event, fight, and fighter data from Sherdog.
 * Uses Cheerio for HTML parsing.
 */

import * as cheerio from "cheerio";
import {
  ScrapedEvent,
  ScrapedFight,
  ScrapedFighter,
  ScrapeResult,
} from "./types";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://www.sherdog.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Delay helper to avoid rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch HTML content from a URL
 */
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Extract Sherdog fighter ID from URL
 * URL format: /fighter/Sean-Strickland-30452
 */
function extractFighterId(url: string): string {
  const match = url.match(/\/fighter\/[^\/]+-(\d+)$/);
  return match ? match[1] : "";
}

/**
 * Normalize weight class string
 */
function normalizeWeightClass(weightStr: string): string {
  const weight = weightStr.trim();

  // Common weight class mappings
  const weightMap: Record<string, string> = {
    heavyweight: "Heavyweight",
    "light heavyweight": "Light Heavyweight",
    middleweight: "Middleweight",
    welterweight: "Welterweight",
    lightweight: "Lightweight",
    featherweight: "Featherweight",
    bantamweight: "Bantamweight",
    flyweight: "Flyweight",
    strawweight: "Strawweight",
    atomweight: "Atomweight",
    "women's strawweight": "Women's Strawweight",
    "women's flyweight": "Women's Flyweight",
    "women's bantamweight": "Women's Bantamweight",
    "women's featherweight": "Women's Featherweight",
  };

  const normalized = weightMap[weight.toLowerCase()];
  return normalized || weight;
}

/**
 * Parse Sherdog date string
 * Format: "Feb 21, 2026"
 */
function parseSherdogDate(dateStr: string): Date {
  try {
    const cleaned = dateStr.trim();
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return new Date();
  } catch {
    return new Date();
  }
}

/**
 * Scrape event data from Sherdog event page
 */
export async function scrapeEvent(
  eventUrl: string
): Promise<ScrapeResult<ScrapedEvent>> {
  try {
    console.log(`Scraping event: ${eventUrl}`);
    const html = await fetchHtml(eventUrl);
    const $ = cheerio.load(html);

    // Extract event name from h1
    const eventName = $("h1").first().text().trim() || "Unknown Event";

    // Extract date and location from event_detail section
    let dateString = "";
    let eventDate = new Date();
    let location = "";
    let venue = "";

    // Event detail contains date and location info
    const eventDetail = $(".event_detail");
    if (eventDetail.length) {
      // Date is usually in a specific format
      const detailText = eventDetail.text();

      // Look for date pattern like "Feb 21, 2026"
      const dateMatch = detailText.match(
        /([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/
      );
      if (dateMatch) {
        dateString = dateMatch[1];
        eventDate = parseSherdogDate(dateString);
      }

      // Location is after the date, usually contains venue and city
      // Format: "Toyota Center, Houston, Texas, United States"
      const locationMatch = detailText.match(
        /(?:United States|Canada|Brazil|UK|Australia|Japan|China|Mexico|UAE|Saudi Arabia|Singapore|Ireland|England|Poland|France|Germany|Netherlands|Sweden|Russia|Thailand|Indonesia|South Korea|Philippines|New Zealand)[^\n]*$/im
      );

      // Try to find venue name and location
      const venuePatterns = [
        /([A-Z][^,\n]+(?:Arena|Center|Centre|Garden|Dome|Stadium|Hall|Coliseum|Pavilion))/i,
      ];

      for (const pattern of venuePatterns) {
        const venueMatch = detailText.match(pattern);
        if (venueMatch) {
          venue = venueMatch[1].trim();
          break;
        }
      }

      // Extract city and country
      const cityMatch = detailText.match(
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*(United States|USA|Canada|Brazil|UK|Australia)?/
      );
      if (cityMatch) {
        location = cityMatch[0].trim();
      }
    }

    // Also try meta tags for date
    const metaDate = $('meta[itemprop="startDate"]').attr("content");
    if (metaDate && !dateString) {
      eventDate = new Date(metaDate);
      dateString = eventDate.toDateString();
    }

    // Extract fights
    const fights: ScrapedFight[] = [];

    // 1. Main Event - from .fight_card
    const mainFightCard = $(".fight_card");
    if (mainFightCard.length) {
      const leftFighter = mainFightCard.find(".fighter.left_side");
      const rightFighter = mainFightCard.find(".fighter.right_side");
      const versus = mainFightCard.find(".versus");

      if (leftFighter.length && rightFighter.length) {
        const fighter1Link = leftFighter.find('a[href*="/fighter/"]').first();
        const fighter2Link = rightFighter.find('a[href*="/fighter/"]').first();

        const fighter1Url = fighter1Link.attr("href") || "";
        const fighter2Url = fighter2Link.attr("href") || "";

        // Get names from span[itemprop="name"] or link text
        const fighter1Name =
          leftFighter.find('span[itemprop="name"]').text().trim() ||
          fighter1Link.text().trim();
        const fighter2Name =
          rightFighter.find('span[itemprop="name"]').text().trim() ||
          fighter2Link.text().trim();

        // Get weight class
        const weightClass = normalizeWeightClass(
          versus.find(".weight_class").text().trim() || "Unknown"
        );

        // Check for title fight
        const versusText = versus.text().toLowerCase();
        const isTitleFight =
          versusText.includes("title") || versusText.includes("championship");

        // Get tier from versus section
        const tierText = versus.find("b").text().trim().toUpperCase();
        let tier: ScrapedFight["tier"] = "Main Event";
        if (tierText.includes("CO-MAIN")) tier = "Co-Main";

        fights.push({
          cardPosition: 1,
          tier,
          weightClass,
          isTitleFight,
          fighter1: {
            name: fighter1Name,
            sherdogUrl: fighter1Url.startsWith("http")
              ? fighter1Url
              : `${BASE_URL}${fighter1Url}`,
            sherdogId: extractFighterId(fighter1Url),
          },
          fighter2: {
            name: fighter2Name,
            sherdogUrl: fighter2Url.startsWith("http")
              ? fighter2Url
              : `${BASE_URL}${fighter2Url}`,
            sherdogId: extractFighterId(fighter2Url),
          },
        });
      }
    }

    // 2. Other fights - from table.new_table.upcoming
    const fightTable = $("table.new_table.upcoming, table.new_table");
    if (fightTable.length) {
      fightTable.find("tr").each((i, row) => {
        const $row = $(row);

        // Skip header row
        if ($row.find("th").length > 0) return;

        // Find fighter links in this row
        const fighterLinks = $row.find('a[href*="/fighter/"]');
        if (fighterLinks.length >= 2) {
          const fighter1Link = fighterLinks.eq(0);
          const fighter2Link = fighterLinks.eq(1);

          const fighter1Url = fighter1Link.attr("href") || "";
          const fighter2Url = fighter2Link.attr("href") || "";

          // Get names - remove any concatenated text
          let fighter1Name = fighter1Link.text().trim();
          let fighter2Name = fighter2Link.text().trim();

          // Fix concatenated names (e.g., "GeoffNeal" -> "Geoff Neal")
          fighter1Name = fighter1Name.replace(/([a-z])([A-Z])/g, "$1 $2");
          fighter2Name = fighter2Name.replace(/([a-z])([A-Z])/g, "$1 $2");

          // Get weight class
          const weightClassEl = $row.find(".weight_class");
          const weightClass = normalizeWeightClass(
            weightClassEl.text().trim() || "Unknown"
          );

          // Check for title fight
          const rowText = $row.text().toLowerCase();
          const isTitleFight =
            rowText.includes("title") || rowText.includes("championship");

          // Determine tier based on position (Sherdog lists fights in reverse order)
          // Card position from the match number column
          const matchNum = $row.find("td").first().text().trim();
          const cardPosition = parseInt(matchNum) || fights.length + 1;

          // Tier based on typical card structure
          let tier: ScrapedFight["tier"] = "Main Card";
          if (cardPosition <= 5) tier = "Prelim";
          else if (cardPosition <= 8) tier = "Prelim";

          fights.push({
            cardPosition: fights.length + 1,
            tier,
            weightClass,
            isTitleFight,
            fighter1: {
              name: fighter1Name,
              sherdogUrl: fighter1Url.startsWith("http")
                ? fighter1Url
                : `${BASE_URL}${fighter1Url}`,
              sherdogId: extractFighterId(fighter1Url),
            },
            fighter2: {
              name: fighter2Name,
              sherdogUrl: fighter2Url.startsWith("http")
                ? fighter2Url
                : `${BASE_URL}${fighter2Url}`,
              sherdogId: extractFighterId(fighter2Url),
            },
          });
        }
      });
    }

    return {
      success: true,
      url: eventUrl,
      data: {
        sherdogUrl: eventUrl,
        name: eventName,
        dateString,
        eventDate,
        location,
        venue,
        fights,
      },
    };
  } catch (error) {
    return {
      success: false,
      url: eventUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Scrape fighter profile from Sherdog
 */
export async function scrapeFighter(
  fighterUrl: string
): Promise<ScrapeResult<ScrapedFighter>> {
  try {
    console.log(`Scraping fighter: ${fighterUrl}`);
    await delay(500); // Rate limiting

    const html = await fetchHtml(fighterUrl);
    const $ = cheerio.load(html);

    const sherdogId = extractFighterId(fighterUrl);

    // Extract fighter name from h1 or meta
    const nameEl = $('h1[itemprop="name"] span, h1.fn');
    let name =
      nameEl.text().trim() ||
      $('meta[property="og:title"]').attr("content")?.split("|")[0].trim() ||
      "Unknown Fighter";

    // Clean up name (remove nickname in quotes if present in the name field)
    name = name.replace(/"[^"]+"\s*/, "").trim();

    // Extract nickname
    let nickname: string | undefined;
    const nicknameEl = $('span.nickname, span[itemprop="alternateName"]');
    if (nicknameEl.length) {
      nickname = nicknameEl.text().replace(/["""'']/g, "").trim();
    }

    // Extract record from bio section
    let record = { wins: 0, losses: 0, draws: 0 };

    const winsEl = $(".winsloses-holder .wins .win span");
    const lossesEl = $(".winsloses-holder .loses .lose span");
    const drawsEl = $(".winsloses-holder .loses .nc  span");

    if (winsEl.length || lossesEl.length) {
      record = {
        wins: parseInt(winsEl.last().text()) || 0,
        losses: parseInt(lossesEl.last().text()) || 0,
        draws: parseInt(drawsEl.last().text()) || 0,
      };
    } else {
      // Try to find record in text
      const pageText = $("body").text();
      const recordMatch = pageText.match(/Record[:\s]*(\d+)-(\d+)-(\d+)/i);
      if (recordMatch) {
        record = {
          wins: parseInt(recordMatch[1]),
          losses: parseInt(recordMatch[2]),
          draws: parseInt(recordMatch[3]),
        };
      }
    }

    // Extract age/birthdate
    let age: number | undefined;
    let birthDate: Date | undefined;

    const ageEl = $('span[itemprop="birthDate"], .item.birthday strong');
    if (ageEl.length) {
      const birthStr = ageEl.text().trim();
      birthDate = new Date(birthStr);
      if (!isNaN(birthDate.getTime())) {
        age = Math.floor(
          (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
      }
    }

    // Also check for age directly
    const ageMatch = $(".item.birthday").text().match(/AGE\s*:\s*(\d+)/i);
    if (ageMatch && !age) {
      age = parseInt(ageMatch[1]);
    }

    // Extract physical stats
    let heightInches: number | undefined;
    let reachInches: number | undefined;

    // Height
    const heightEl = $('span[itemprop="height"], .item.height strong');
    if (heightEl.length) {
      const heightText = heightEl.text();
      // Format: 6'1" or 185 cm
      const ftMatch = heightText.match(/(\d+)'(\d+)"/);
      if (ftMatch) {
        heightInches = parseInt(ftMatch[1]) * 12 + parseInt(ftMatch[2]);
      } else {
        const cmMatch = heightText.match(/(\d+)\s*cm/);
        if (cmMatch) {
          heightInches = Math.round(parseInt(cmMatch[1]) / 2.54);
        }
      }
    }

    // Reach
    const reachEl = $(".item.reach strong");
    if (reachEl.length) {
      const reachText = reachEl.text();
      const reachMatch = reachText.match(/(\d+)/);
      if (reachMatch) {
        reachInches = parseInt(reachMatch[1]);
      }
    }

    // Weight class from association or title
    let weightClass: string | undefined;
    const wcEl = $(".association-class a").last();
    if (wcEl.length) {
      weightClass = normalizeWeightClass(wcEl.text().trim());
    }

    // Country
    let country: string | undefined;
    const nationalityEl = $(
      'span[itemprop="nationality"], .item.nationality strong'
    );
    if (nationalityEl.length) {
      country = nationalityEl.text().trim();
    }

    // Image URL
    let imageUrl: string | undefined;
    const imgEl = $('img[itemprop="image"], .profile_image img').first();
    if (imgEl.length) {
      const src = imgEl.attr("src");
      if (src) {
        imageUrl = src.startsWith("http") ? src : `${BASE_URL}${src}`;
      }
    }

    // Determine fighter class based on fight history analysis
    // This is a simplified heuristic
    const fighterClass: ScrapedFighter["fighterClass"] = "All-Rounder";

    return {
      success: true,
      url: fighterUrl,
      data: {
        sherdogUrl: fighterUrl,
        sherdogId,
        name,
        nickname,
        birthDate,
        age,
        heightInches,
        reachInches,
        record,
        country,
        weightClass,
        fighterClass,
        imageUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      url: fighterUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Scrape all fighters from an event
 */
export async function scrapeEventFighters(
  event: ScrapedEvent
): Promise<Map<string, ScrapedFighter>> {
  const fighters = new Map<string, ScrapedFighter>();

  for (const fight of event.fights) {
    // Scrape fighter 1
    const fighter1Url = fight.fighter1.sherdogUrl || fight.fighter1.tapologyUrl;
    const fighter1Id = fight.fighter1.sherdogId || fight.fighter1.tapologyId;

    if (fighter1Url && fighter1Id && !fighters.has(fighter1Id)) {
      const result = await scrapeFighter(fighter1Url);
      if (result.success && result.data) {
        fighters.set(fighter1Id, result.data);
      }
    }

    // Scrape fighter 2
    const fighter2Url = fight.fighter2.sherdogUrl || fight.fighter2.tapologyUrl;
    const fighter2Id = fight.fighter2.sherdogId || fight.fighter2.tapologyId;

    if (fighter2Url && fighter2Id && !fighters.has(fighter2Id)) {
      const result = await scrapeFighter(fighter2Url);
      if (result.success && result.data) {
        fighters.set(fighter2Id, result.data);
      }
    }
  }

  return fighters;
}
