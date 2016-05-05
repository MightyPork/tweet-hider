
'use strict';

var tweetHider = (function(){
	var self = {};

	var SEL_TWEET = 'div.tweet.js-stream-tweet';
	var SEL_STREAM = '.stream .stream-items';
	var SEL_TWEET_CONTENT = '.js-tweet-text, .tweet-text, .entry-content, .twtr-tweet-text';

	self.target = null;
	self.observer = null;
	self.count = 0;

	self.debug = false;

	/** The currently loaded hidden tweet list */
	self.hiddenTweets = [];

	/** Initialize the filter */
	self.init = function() {
		self.loadHidden(self.init2);
	};

	/** Init - part 2 */
	self.init2 = function() {
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

		setInterval(function() {
			if (!document.contains(self.target)) {
				self.onPageChange();
			}
		}, 500);

		// Hide click action
		$(document).on('click', '.th_hide-link', function() {
			if(self.debug) console.log('hiding tweet!!');

			var id = $(this).closest('.tweet').data('tweet-id');
			self.persistHide(id);

			$(this).closest('.stream-item').addClass('hidden');
		});

		if(self.debug) console.log('Tweet Hider initialized!');

		// initial fire
		self.onTweetChange();
	};

	/** Load list of hidden tweets from the storage */
	self.loadHidden = function(cb) {
		chrome.storage.sync.get('hiddenTweets', function(obj){
			var ht = obj.hiddenTweets;
			if(self.debug) console.log('Hidden tweet list loaded', ht);

			if (typeof ht == 'undefined') ht = [];
			self.hiddenTweets = ht;

			self.storeHidden();
			cb();
		});
	};

	/** Write the hidden tweet list to the storage */
	self.storeHidden = function() {
		var obj = {'hiddenTweets': self.hiddenTweets};
		chrome.storage.sync.set(obj, function() {
			if(self.debug) console.log('Hidden tweet list saved', self.hiddenTweets);
		});
	};

	/** Persist a tweet hide - add ID to storage & save */
	self.persistHide = function(tweetId) {
		if(self.debug) console.log('Persisting hide of ',tweetId);

		self.hiddenTweets.push(tweetId);

		self.storeHidden();
	};

	/** Check if tweet should be hidden */
	self.isHidden = function(tweetId) {
		if(self.debug) console.log('is hidden?',tweetId,', all =',self.hiddenTweets);

		var hidden = _.includes(self.hiddenTweets, tweetId);

		if(self.debug) console.log(hidden);

		return hidden;
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

	/** Change in timeline - means new tweets may have been loaded, page changed etc */
	self.onTweetChange = function(force) {
		if (force) {
			// force filter to run
			self.count = 0;
		}

		// TODO this is not very efficient.
		// TODO add some marker class to processed tweets and ignore them in the selector?

		var $tweets = $(SEL_TWEET);

		if ($tweets.length != self.count) {
			self.count = $tweets.length;

			if(self.debug) console.log('Tweet change!');

			$.each($tweets, function() {
				var $tw = $(this);
				if ($tw.hasClass('hidden')) return; // ignore
				if ($tw.data('th_processed')) return; // already done

				if(self.debug) console.log('fixing tweet');

				$tw.find('.dropdown-menu ul')
					.append('<li class="th_hide-link" data-nav="hide"><button type="button" class="dropdown-link">Hide this trash!</button></li>');

				$tw.data('th_processed', true);

				if (self.isHidden($tw.data('tweet-id'))) {
					$tw.addClass('hidden');
				}
			});
		}
	};

	return self;
})();

tweetHider.init();
