/**
 *
 * HTML5 Templatable Image Galery (jQuery plugin)
 *
 * Author: Florent SCHILDKNECHT 2013
 *
 * Dependencies:
 * - jQuery >= 1.7.2
 * - mustache >= ???
 *
 */

// JavaScript non-bloquant debuging
function debug (error) {
	if (console && console.log) {
		console.log('DEBUG', error);
	} else {
		alert('DEBUG' + error);
	}
};
// Make sure Object.create is available in the browser (for our prototypal inheritance)
// Courtesy of Douglas Crockford
if (typeof Object.create !== 'function') {
    Object.create = function (object) {
        function F() {}
        F.prototype = object;
        return new F();
    };
}
(function ($) {
	var FSBGalery = {
		init: function (element, config) {
			this.settings = config;
			this.wrapper = $(element);
			this.currentItemIndice = this.settings.currentItemIndice;
			this.showLoader();
			this.locked = false;
			if ((this.settings.fromJson !== false) && (typeof this.settings.fromJson == 'string')) {
				$.getJSON(this.settings.fromJson, function (data) {
					this.initWithData(data);
				});
			} else if (this.settings.data.length > 0) {
				this.initWithData(this.settings.data);
			} else {
				debug('Hum, there is currently no data to manage.');
			}
		},
		showLoader: function () {
			var loader = $('<figure/>', {
				class: 'fsb-loader-container'
			}).append($('<img/>', {
				src: 'assets/images/loader.gif',
				class: 'fsb-loader'
			})).appendTo(this.wrapper);
		},
		hideLoader: function () {
			$('.fsb-loader-container').remove();
		},
		initWithData: function (data) {
			// Data should be an array of strings, or an array of JSON objects
			this.data = data;
			// Insert data items into the DOM
			this.dataContainer = $('<div/>', {
				class: 'fsb-galery-data-container'
			}).prependTo(this.wrapper);
			for (var i = 0; i < data.length; i++) {
				this.addItem(i, data[i]);
			}
			// Insert controls block into the DOM if user wants
			if (this.settings.showControls) {
				this.displayControls();
			}
			if (this.settings.showNavigation || this.settings.showThumbnails) {
				this.navigationWrapper = $('<div/>', {
					class: 'fsb-galery-navigation-wrapper'
				}).appendTo(this.wrapper);
				// Insert navigation pins into the DOM if user wants
				var navigationWrapperHeight = 0;
				if (this.settings.showNavigation) {
					this.displayNavigation();
					navigationWrapperHeight += 25;
				}
				// Insert thumbnails into the DOM if user wants
				if (this.settings.showThumbnails) {
					this.displayThumbnails();
					navigationWrapperHeight += 50;
				}
				this.navigationWrapper.css('height', navigationWrapperHeight);
			}
			// And here we GO !
			this.hideLoader();
		},
		addItem: function (indice, item) {
			var src = item.folder + item.filename + item.extension,
				item = $('<div/>', {
					class: 'fsb-galery-data-item' + (indice == 0 ? ' active' : '')
				}).html($('<img/>', {
					src: src,
					alt: item.description
				})).appendTo(this.dataContainer);
		},
		displayControls: function () {
			var self = this;
			// Container
			this.controlsContainer = $('<div/>', {
				class: 'fsb-galery-controls'
			}).appendTo(this.wrapper);
			// Previous arrow
			this.previousLink = $('<a/>', {
				href: '#',
				id: 'fsb-galery-controls-previous'
			}).html('&lsaquo;').appendTo(this.controlsContainer);
			// Next arrow
			this.nextLink = $('<a/>', {
				href: '#',
				id: 'fsb-galery-controls-next'
			}).html('&rsaquo;').appendTo(this.controlsContainer);
			// Bind click events
			$(this.previousLink).on('click', function () {
				self.showPreviousItem();
				return false;
			});
			$(this.nextLink).on('click', function () {
				self.showNextItem();
				return false;
			});
		},
		displayNavigation: function () {
			var self = this;
			this.navigationContainer = $('<div/>', {
				class: 'fsb-galery-navigation'
			}).appendTo(this.navigationWrapper);
			// Foreach item, add a pin
			for (var i = 0; i < this.data.length; i++) {
				this.addPin(i, this.data[i]);
			}
			$(this.navigationContainer).find('.fsb-galery-navigation-item').on('click', function (clickEvent) {
				self.currentItemIndice = self.getIndice($(this).attr('data-slide'));
				self.showItem();
				return false;
			});
		},
		addPin: function (indice, item) {
			var pin = $('<a/>', {
				href: '#',
				class: 'fsb-galery-navigation-item' + (indice == 0 ? ' active' : ''),
				'data-slide': indice
			}).html(indice + 1).appendTo(this.navigationContainer);
		},
		displayThumbnails: function () {
			var self = this;
			this.thumbnailsContainer = $('<div/>', {
				class: 'fsb-galery-thumbnails'
			}).appendTo(this.navigationWrapper);
			for (var i = 0; i < this.data.length; i++) {
				this.addThumbnail(i, this.data[i]);
			}
			$(this.thumbnailsContainer).find('.fsb-galery-thumbnail-item').on('click', function (clickEvent) {
				self.currentItemIndice = self.getIndice($(this).attr('data-slide'));
				self.showItem();
				return false;
			});
		},
		addThumbnail: function (indice, item) {
			var src = ((this.settings.thumbnailsDirectory.length > 0) ? this.settings.thumbnailsDirectory : item.folder) + item.filename + item.extension,
				thumbnail = $('<a/>', {
					href: '#',
					class: 'fsb-galery-thumbnail-item' + (indice == 0 ? ' active' : ''),
					'data-slide': indice
				}).html($('<img/>', {
					src: src,
					alt: item.description
				})).appendTo(this.thumbnailsContainer);
		},
		showPreviousItem: function (clickEvent) {
			this.currentItemIndice = this.getIndice(this.currentItemIndice - 1);
			this.showItem();
			return false;
		},
		showNextItem: function (clickEvent) {
			this.currentItemIndice = this.getIndice(this.currentItemIndice + 1);
			this.showItem();
			return false;
		},
		showItem: function () {
			var self = this,
				dataContainer = this.dataContainer,
				settings = this.settings,
				currentItemIndice = this.currentItemIndice;

			if (this.locked !== true) {
				this.locked = true;
				switch (this.settings.animation) {
					case 'fade':
						console.log('fade');
						break;
					case 'slide':
						console.log('slide');
						break;
					default:
						console.log('Ooohooo sorry, I do not have programmed this animation yet !');
						break;
				}
				$(dataContainer).find('.fsb-galery-data-item.active').fadeOut(settings.animationSpeed, function () {
					//self.showLoader();
					$(this).removeClass('active');
					$(self.navigationContainer).find('.fsb-galery-navigation-item.active').removeClass('active');
					$(self.thumbnailsContainer).find('.fsb-galery-thumbnail-item.active').removeClass('active');
					$(self.navigationContainer).find('.fsb-galery-navigation-item').eq(currentItemIndice).addClass('active');
					$(self.thumbnailsContainer).find('.fsb-galery-thumbnail-item').eq(currentItemIndice).addClass('active');
					$(dataContainer).find('.fsb-galery-data-item').eq(currentItemIndice).fadeIn(settings.animationSpeed, function () {
						$(this).addClass('active');
						self.locked = false;
						//self.hideLoader();
					});
				});
			}
			
		},
		getIndice: function (indice) {
			if (indice < 0) {
				if (indice < -this.data.length) {
					indice += this.data.length;
				}
			} else if (indice > (this.data.length - 1)) {
				indice = 0;
			}
			return indice;
		},
		destroy: function () {
			$(this.previousLink).off('click');
			$(this.nextLink).off('click');
			$(this.wrapper).remove();
		}
	}
	$.fn.FSBGalery = function (config) {
		var defaults = {
			// Data config
			fromJson: false,
			data: [],
			currentItemIndice: 0,
			// Animation config
			animation: 'fade',
			animationSpeed: 600,
			// Controls config
			showControls: true,
			// Navigation config
			showNavigation: true,
			// Thumbnails config
			showThumbnails: true,
			thumbnailsDirectory: ''
		}
		if (this.length) {
			return this.each ( function () {
				var Galery = Object.create(FSBGalery);
				Galery.init(this, $.extend(defaults, config));
			});
		}
	}
})(jQuery);