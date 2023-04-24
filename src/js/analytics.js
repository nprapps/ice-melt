var DataConsent = require('./lib/data-consent');
var googleAnalyticsAlreadyInitialized = false;
var permutiveAlreadyInitialized = false;

var setupGoogleAnalytics = function() {
  // Bail early if opted out of Performance and Analytics consent groups
  if (!DataConsent.hasConsentedTo(DataConsent.PERFORMANCE_AND_ANALYTICS)) return;

	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

	if (window.top !== window) { 

		ga("create", "UA-5828686-75", "auto");
		// By default Google tracks the query string, but we want to ignore it.
		var here = new URL(window.location);

		ga("set", "location", here.protocol + "//" + here.hostname + here.pathname);
		ga("set", "page", here.pathname);

		// Custom dimensions & metrics
		var parentUrl = here.searchParams.has("parentUrl") ? new URL(here.searchParams.get("parentUrl")) : "";
		var parentHostname = "";

		if (parentUrl) {
		    parentHostname = parentUrl.hostname;
		}

		var initialWidth = here.searchParams.get("initialWidth") || "";

		ga("set", {
		  dimension1: parentUrl,
		  dimension2: parentHostname,
		  dimension3: initialWidth
		});
	} else { 

		// Secondary topics
		var dim6 = "";
		// Topic IDs
		var dim2 = "";

		// Google analytics doesn't accept arrays anymore, these must be strings.

		try {
		  dim6 = window.PROJECT_ANALYTICS.secondaryTopics.join(", ");
		} catch (error) {
		  console.log("PROJECT_ANALYTICS.secondaryTopics is not an array, check project.json");
		}

		try {
		  dim2 = window.PROJECT_ANALYTICS.topicIDs.join(", ");
		} catch (error) {
		  console.log("PROJECT_ANALYTICS.topicIDs is not an array, check project.json");
		}

		ga("create", "UA-5828686-4", "auto");
		ga("set", {
		  dimension2:  dim2,
		  dimension3:  window.PROJECT_ANALYTICS.primaryTopic || "News",
		  dimension6:  dim6,
		  dimension22: document.title
		});
	} 
	ga("send", "pageview");
	googleAnalyticsAlreadyInitialized = true;
};

var setupPermutive = function() {
  // Bail early if opted out of Targeting and Sponsorship consent groups
  if (!DataConsent.hasConsentedTo(DataConsent.TARGETING_AND_SPONSOR)) return;

  console.log("setup permutive");

  var here = new URL(window.location);
  var schema = document.querySelector('script[type="application/ld+json"]');
  var schemaContent = JSON.parse(schema.innerText);

  // add params
  window.permutive.consent({ opt_in: true, token: 'CONSENT_CAPTURED' });
  const byline = schemaContent.author.name ? schemaContent.author.name : "";
  const arrayOfParents = window.PROJECT_ANALYTICS.topicIDs ? window.PROJECT_ANALYTICS.topicIDs : [];
  const storyID = here.searchParams.has("parentUrl") ? new URL(here.searchParams.get("parentUrl")) : "";
  const title = document.title ? document.title : "";
  const publisher = schemaContent.publisher.name ? schemaContent.publisher.name : "";
  const pubTime = schemaContent.datePublished ? schemaContent.datePublished : "";

  window.permutive.addon('web',{
    "content": {
      "Type": "text", // "text"
      "byline": byline, // ["list", "of", "strings"]
      "parents": arrayOfParents, // ["list", "of", "strings"]
      "publishTime": "", // "2021-11-09T16:20:05.063Z"
      "publisher": publisher, // "text"
      "storyId": storyID, // "text"
      "title": title // "text"
    }
  });

  // inject main permutive js
  const el = document.createElement('script');
  el.async = true;
  el.type = 'text/javascript';
  el.id = 'permutive-js-tag';
  el.src = 'https://e1cef1f0-495f-4973-ba1c-880786e73a66.edge.permutive.app/e1cef1f0-495f-4973-ba1c-880786e73a66-web.js';
  const firstNode = document.getElementsByTagName('script')[0];
  firstNode.parentNode.insertBefore(el, firstNode);

  permutiveAlreadyInitialized = true;
}

// Listen for DataConsentChanged event 
document.addEventListener('npr:DataConsentChanged', () => {
  // Bail early if it's already been set up 
  // if (googleAnalyticsAlreadyInitialized) return;
  // if (permutiveAlreadyInitialized) return;

  // When a user opts into Performance and Analytics cookies, initialize GA
  if (!googleAnalyticsAlreadyInitialized && DataConsent.hasConsentedTo(DataConsent.PERFORMANCE_AND_ANALYTICS)) {
    setupGoogleAnalytics();
  }  

  // When a user opts into Targeting and Sponsorship cookies, initialize Permutive
  if (!permutiveAlreadyInitialized && DataConsent.hasConsentedTo(DataConsent.TARGETING_AND_SPONSOR)) {
    setupPermutive();
  }  
});

// Add GA initialization to window.onload
var oldOnload = window.onload;
window.onload = (typeof window.onload != 'function') ? setupGoogleAnalytics : function() { oldOnload(); setupGoogleAnalytics(); };

// initialize permutive only if this is a standalone project
if (window.top == window) {
  window.onload = (typeof window.onload != 'function') ? setupPermutive : function() { oldOnload(); setupPermutive(); };
}