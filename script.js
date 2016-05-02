
'use strict';

var tweetFilter = (function(){
	var self = {};
	
	var SEL_TWEET = 'div.tweet.js-stream-tweet';
	var SEL_STREAM = '.stream .stream-items';
	var SEL_TWEET_CONTENT = '.js-tweet-text, .tweet-text, .entry-content, .twtr-tweet-text';
	
	self.target = null;
	self.observer = null;
	self.count = 0;
	
	
	function closest(el, selector) {
		var matchesFn;

		// find vendor prefix
		['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
			if (typeof document.body[fn] == 'function') {
				matchesFn = fn;
				return true;
			}
			return false;
		})

		// traverse parents
		while (el!==null) {
			parent = el.parentElement;
			if (parent!==null && parent[matchesFn](selector)) {
				return parent;
			}
			el = parent;
		}

		return null;
	};
	
	
	
	/** Initialize the filter */
	self.init = function() {
		console.log('Tweet Filter initialized!');
		
		// create an observer for the timeline
		self.target = document.querySelector(SEL_STREAM);

		self.observer = (new MutationObserver(function(mutations) {
			mutations.forEach(self.onTweetChange);
		}));

		self.observer.observe(self.target, {
			attributes: false, 
			childList: true,
			characterData: false
		});
		
		window.addEventListener("hashchange", self.onPageChange, false);
		
		setInterval(function() {
			if (!document.contains(self.target)) {
				self.onPageChange();
			}
		}, 500);
		
		// initial fire
		self.onTweetChange();
	};
	
	/** Get all tweets */
	self.tweets = function() {
		return document.querySelectorAll(SEL_TWEET);
	};
	
	/** Change in url, need to rebuild listener */
	self.onPageChange = function() {
		self.observer.disconnect();
		
		self.target = document.querySelector(SEL_STREAM);
		self.observer.observe(self.target, {
			attributes: false, 
			childList: true,
			characterData: false
		});
		
		// fire tweet change to hide stuff
		self.onTweetChange(true);
	};
	
	self.filterMatches = function(string, filter) {
		// exact match
		return ~string.indexOf(filter);
	};
	
	/** Change in timeline */
	self.onTweetChange = function(force) {
		if (force) {
			// force filter to run
			self.count = 0;
		}
		
		var tweets = self.tweets();
		
		if (tweets.length != self.count) {
			self.count = tweets.length;
			
			console.log('Tweet change!');
			// TODO perform filtering
			
			for(var i = 0; i < tweets.length; i++) {
				var tweet = tweets[i];
				
				if (tweet.classList.contains('hidden')) continue; // already hidden
				
				var textNode = tweet.querySelector(SEL_TWEET_CONTENT);
				if (textNode) {
					var text = textNode.textContent;
					if (self.filterMatches(text, 'Trump')) {
						console.log('Hiding tweet: ', textNode.textContent, tweet);
						tweet.classList.add('hidden');
					}
				}
			}
		}
	};
	
	return self;
})();

tweetFilter.init();
