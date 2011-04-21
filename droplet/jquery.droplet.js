/*!
 * jquery.droplet.
 *
 * Copyright (c) 2010 Garrett Bjerkhoel
 * http://garrettbjerkhoel.com
 */
(function($) {
  $.fn.extend({
    scrollTo : function(speed, easing) {
      return this.each(function() {
        var targetOffset = $(this).offset().top;
        $('html,body').animate({ scrollTop: targetOffset }, speed, easing);
      });
    }
  });
  
  $.fn.droplet = function(options) {
    
    var defaults = {
        fadeSpeed: 150,
        parseSelectedOffset: true,
        wrapperClass: 'droplet_wrapper',
        listClass: 'droplet_list',
        placeholderClass: 'droplet_placeholder',
        scrollToSelect: true,
        scrollSpeed: 500
      }, opts = $.extend(defaults, options);
    
    return this.each(function() {
      if(!$.nodeName(this, 'select')) return;
      
      // Default options
      var $this = $(this);
      
      /* Calculates all height dimensions because $.height()
         returning 0 due to appended elements */
      var getItemHeight = function(item, index) {
        var pTop = parseInt(item.css('padding-top')),
            pBottom = parseInt(item.css('padding-bottom')),
            mTop = parseInt(item.css('margin-top')),
            mBottom = parseInt(item.css('margin-bottom')),
            height = parseInt(item.css('height'));
            
        // IE 7+ returns NaN
        mTop = (isNaN(mTop)) ? 0 : mTop;
        mBottom = (isNaN(mBottom)) ? 0 : mBottom;
        
        return '-'+ Math.round(index*(pTop+pBottom+mTop+mBottom+height)) +'px';
      }
      
      /* When the menu is active, it will stay active until
         the user clicks the elsewhere to deactivate it */
      var menuFadeout = function (e) {
        // handles if they click on either the <button> or the <span> within the button.
        var span = $(e.target).parent().prev(),
            button = $(e.target).prev();
        
        if(!span.hasClass(opts.listClass) && !button.hasClass(opts.listClass)) {
          dropletList.fadeOut(opts.fadeSpeed);
        }
      }
      
      /* In special cases when the browser makes the surrounding inputs
         focusable, we need to similate the dropdown as 1 input */
      var moveToNextInput = function (e) {
        e.preDefault();
        $(this).closest('select,input[type="text"]').focus();
        return false;
      }
      
      /* If the user presses enter when a item is selected, it will trigger updateHiddenValue()
         if not it will move the selected up or down */
      var selectEvent = function (e) {
        var selected = dropletList.find('.selected'),
            offset = selected.parent().prevAll().size(),
            maxOffset = selected.parents('ul:eq(0)').find('li').size();
        
        // If they press enter, return and update with selected item
        if (e.keyCode == 13) {
          selected.click();
          return false;
        }
        
        // Check keycodes to increment or decrement the offset to move the selected class.
        // 38 = Up, 40 = Down
        selected.removeClass('selected');
        switch(e.keyCode) {
          case 38:
            offset--;
          break;
          case 40:
            offset++;
          break;
        }
        
        // To make sure they can't go into negative or non-existing options that aren't available
        if(offset <= 0) {
          offset = 0;
        } else if(offset >= maxOffset) {
          offset--;
        }
        
        dropletList.find('a:eq('+ offset +')').addClass('selected');
      }
          
      // Will handle the change of pressing enter, clicking on a option, tab, etc.
      var toggleDropletList = function (e) {
        e.preDefault();
        
        if(e.type == 'blur') {
          // When no action takes place and they re-tab
          dropletList.fadeOut(opts.fadeSpeed).removeAttr('id');
          $(document).unbind('keyup', selectEvent)
                     .unbind('click', menuFadeout);
        } else {
          if(dropletList.is(':hidden')) {
            $('#open_droplet').fadeOut(opts.fadeSpeed).removeAttr('id');
            dropletList.attr('id', 'open_droplet').fadeIn(opts.fadeSpeed, function () {
              $(document).bind('keyup', selectEvent)
                         .bind('click', menuFadeout);
            });
            
            // Only if they press tab
            if(opts.scrollToSelect && e.type == 'focus') {
              dropletList.scrollTo(opts.scrollSpeed);
            }
          } else {
            dropletList.removeAttr('id').fadeOut(opts.fadeSpeed);
          }
        }
      }
      
      // Handles pressing enter on a selected option, clicking on a option, etc.
      var updateHiddenValue = function (e) {
        e.preDefault();
        
        var selected = $(this),
            openDroplet = $('#open_droplet'),
            index = selected.parent().prevAll().size();
        
        // Set selected, and remove the class from the previous selected item
        if($('a.selected', openDroplet) != selected) {
          $('a.selected', openDroplet).removeClass('selected');
          openDroplet.removeAttr('id');
        }
        
        selected.addClass('selected');
        dropletValue.val(selected.attr('href'));
        dropletPlaceholder.html('<span>'+ selected.text() +'</span>');
        
        dropletList.fadeOut(opts.fadeSpeed, function () {
          if(opts.parseSelectedOffset) {
            $(this).css('margin-top', getItemHeight(selected, index));
          }
        });
        
        selected.parents('form:eq(0)').trigger('change');
        $(document).unbind('keyup');
        
		//create arguments to pass, starting with the data as base
		var args = selected.data();
		args.name = selected.text()
		args.value = selected.attr('href');

        // Trigger the callback if one is given
        if($.isFunction(opts.change)) {
          opts.change.call(dropletPlaceholder, args, index);
        }
      }
      
      // All markup
      var dropletContainer = $('<div></div>', {
            'class': opts.wrapperClass +' '+ $(this).attr('class')
          }),
          dropletList = $('<ul></ul>', {
            'class': opts.listClass
          }).hide(),
          dropletPlaceholder = $('<button></button>', {
            'class': opts.placeholderClass,
            html: '<span>'+ $(':selected', this).text() +'</span>',
            click: toggleDropletList,
            focus: moveToNextInput
          }),
          dropletFocusElement = $('<input/>', {
            type: 'text',
            value: '',
            id: $(this).attr('name'),
            focus: toggleDropletList,
            blur: toggleDropletList,
            keypress: function (e) {
              if(e.keyCode == 13) {
                e.preDefault();
                return false;
              }
            }
          }).css({
            opacity: '0',
            width: '1px',
            height: '1px'
          }),
          dropletValue = $('<input/>', {
            type: 'hidden',
            focus: moveToNextInput,
            value: $(':selected', this).val(),
            name: $(this).attr('name')
          });
      
      // IE will display a blinking pipe, this will hide it
      if($.browser.msie) {
        dropletFocusElement.css('width', '0px');
      }
      
	// Generate all anchors inside of the <ul>
      $('option', this).each(function (i) {
		dropletList.append($('<li></li>', {
			'class': $(this).val().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-]/g,'').toLowerCase(),
        }).html($('<a></a>', {
          'class': ($this.val() === $(this).val()) ? 'selected' : '',
          href: $(this).val(),
          text: $(this).text(),
          click: updateHiddenValue,
		  data: $(this).data()
        })));
      
      // Write all the new HTML replacing the given <select>
      $(this).before(dropletContainer.append(dropletList)
                                     .append(dropletPlaceholder)
                                     .append(dropletFocusElement)
                                     .append(dropletValue)).remove();
      
      // Generate the initial offset if the selectedIndex isn't 0
      var selectedIndex = $this.attr('selectedIndex');
      if(selectedIndex != 0 && opts.parseSelectedOffset) {
        dropletList.css('margin-top', getItemHeight(dropletList.find('a:eq('+ selectedIndex +')'), selectedIndex))
      }
    });
  }
})(jQuery);