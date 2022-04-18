/****** ----   PREPARING TARGETS    ---- ******/
// Query all the HTML target elements to be observed
// These have been taged with the 'observed' class
// For each campaign queried, add stats to track
// Stats are added as custom data attributes

let observedCampaigns = document.querySelectorAll(".observed");
observedCampaigns.forEach((campaign) => {
  campaign.dataset.totalViewTime = 0;
  campaign.dataset.lastViewStarted = 0;
});

/****** ----    DATA MANAGEMENT     ---- ******/
// Manage the visibility of campaigns in unique-value object 'Set'
// At change of document visibility, store campaigns in previouslyVisibleCampaigns
// Manage each campaign interval at interrsection changes
// Reporting information gets stored and sent at page change (document visibility)

let visibleCampaigns = new Set();
let previouslyVisibleCampaigns = null;

let intervalsIDs = [];
let report = [];

/****** ----    INTERSECTION OBSERVER     ---- ******/

const createObserver = () => {
  let options = {
    root: null,
    rootMargin: "0px",
    threshold: [0, 1]
  };

  let observer = new IntersectionObserver(intersectionCallback, options);
  observedCampaigns.forEach((campaign) => {
    observer.observe(campaign);
  });
};

const intersectionCallback = (entries) => {
  entries.forEach((entry) => {
    let campaignBox = entry.target;
    // Target is fully in viewport
    if (entry.intersectionRatio === 1) {
      campaignBox.dataset.lastViewStarted = entry.time;
      visibleCampaigns.add(campaignBox);
      callInterval(campaignBox);
      // Target is fully out of viewport
    } else if (entry.intersectionRatio === 0) {
      visibleCampaigns.delete(campaignBox);
      // If there are intervals stored
      if (intervalsIDs.length > 0) {
        // Get interval ID for cleanup
        let intervalToRemove = intervalsIDs.find(
          (intervalEntry) => intervalEntry.campaignID === campaignBox.id
        );
        if (intervalToRemove) {
          clearInterval(intervalToRemove.intervalID);
          // Remnove interval from array
          intervalsIDs = intervalsIDs.filter(
            (intervalEntry) => intervalEntry.campaignID !== campaignBox.id
          );
        }
      }
    }
  });
};

createObserver();

/****** ----    INTERVAL FUNCTIONS     ---- ******/

const handleInterval = (campaign) => {
  console.log(`Running interval ${campaign.id}`);

  // Update the target elements time data
  let previousTime = campaign.dataset.totalViewTime;
  updateTimer(campaign);

  // Set the time if any difference is found from before after values
  if (previousTime !== campaign.dataset.totalViewTime) {
    window.requestAnimationFrame(() => {
      setTimer(campaign);
    });
  }
};

const updateTimer = (campaign) => {
  let lastStarted = campaign.dataset.lastViewStarted;
  let currentTime = performance.now();

  let diff = currentTime - lastStarted;
  campaign.dataset.totalViewTime =
    parseFloat(campaign.dataset.totalViewTime) + diff;
  campaign.dataset.lastViewStarted = currentTime;
};

const setTimer = (campaign) => {
  let totalSeconds = campaign.dataset.totalViewTime / 1000;
  let sec = Math.floor(totalSeconds % 60);
  let min = Math.floor(totalSeconds / 60);

  let campaignReport = report.find((i) => i.campaign === campaign.id);

  if (!campaignReport) {
    report.push({
      campaign: campaign.id,
      totalViewTime: min + ":" + sec.toString().padStart(2, "0")
    });
  } else {
    campaignReport.totalViewTime = min + ":" + sec.toString().padStart(2, "0");
  }
  let timer = document.querySelector(`#${campaign.id} .timer`);
  timer.innerText = ` — In view for: ${
    min + ":" + sec.toString().padStart(2, "0")
  }`;
};

// Interval function and storal of Interval IDs for management
const callInterval = (campaign) => {
  let intervalID = window.setInterval(() => handleInterval(campaign), 1000);
  intervalsIDs.push({ intervalID: intervalID, campaignID: campaign.id });
};

/****** ----    VISIBILITY LISTENER     ---- ******/

const handleVisibilityChange = () => {
  if (document.hidden) {
    if (!previouslyVisibleCampaigns) {
      previouslyVisibleCampaigns = visibleCampaigns;
      visibleCampaigns = [];
      previouslyVisibleCampaigns.forEach(function (campaign) {
        updateTimer(campaign);
        if (intervalsIDs.length > 0) {
          let intervalToRemove = intervalsIDs.find(
            (intervalEntry) => intervalEntry.campaignID === campaign.id
          );
          if (intervalToRemove) {
            clearInterval(intervalToRemove.intervalID);
            intervalsIDs = intervalsIDs.filter(
              (intervalEntry) => intervalEntry.campaignID !== campaign.id
            );
          }
        }
      });
    }
    console.log(report);
  } else {
    previouslyVisibleCampaigns.forEach(function (campaign) {
      callInterval(campaign);
      campaign.dataset.lastViewStarted = performance.now();
    });
    visibleCampaigns = previouslyVisibleCampaigns;
    previouslyVisibleCampaigns = null;
  }
};

document.addEventListener("visibilitychange", handleVisibilityChange, false);
