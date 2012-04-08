(function($) {
  "use strict";
  var $area = $('<div>').addClass('notification-area'),
      $queue = $({}), // queue holder - we queue animations up so 
      // that only one may execute at once.
      queueName = 'jKnotify',
      queued = 0,
      animation = 'height',
      _animate = function(callback) {
        var $e = $(this);
        if (!$e.parents('.notification-area').length) return;
        $queue
          .queue(queueName, function() {
            var animObj = {};
            animObj[animation] = 'toggle';
            $e.animate(animObj, 'fast', 'linear', 
              function() { 
                queued--;
                $queue.dequeue(queueName);
                if (typeof callback === 'function')
                  callback.call($e);
              }
            );
          });
          if (queued === 0)
            $queue.dequeue(queueName);
          queued++;
      },
      resize = function() {
        $area.css('max-height', $(window).height() + 'px');
      };



  $(document).ready(function() {    
    resize();
    $(window).resize(resize);
    $('body').append($area);
  });
  
  // Put these global somewhere so they can be used slightly more easily.
  window.jKnotify = {
    close : 
      function(e) {
        _animate.call(e, function() {$(this).remove();});
      },
    open : 
      function(e) {
          _animate.call(e);
      },
    collapse : 
      function(e) {
        _animate.call($(e).find('.message'));
      },
    uncollapse :
       function(e) {
        _animate.call($(e).find('.message'));
      }
  };

  // Closes a notification.
  $.fn.jKnotifyClose = function() {
    return $(this).each(function() {
      jKnotify.close(this);
    });
  };

  /*
   * jKnotify( message, [options] )
   */
  $.jKnotify = function(message, options) {
    options = $.extend(true, {
        timeout: false,     // disappear timer
        titleBar: true,     // whether to show the title bar
        collapse: false,   // collapse timer
        title: false,      // title 
        icon: false,      // src to icon
        passive: true,    // closes on click or not
        closeOnButtonClick: true, // close if a button is pressed
        closable: true // show the 'x'
      }, options);
      
    var collapse_timer,
         $notification = $('<div>').addClass('notification');
    
    (function() {
      // construct the element
      var $titleBar;
      if (options.titleBar) {
        $titleBar = $('<div>').addClass('title-bar');
        if (options.icon) 
          $titleBar.append( $('<img>').attr('src', options.icon).addClass('icon') );
        $titleBar.append( $('<div>').text(options.title || '') );
        if (options.closable)
          $titleBar.append( 
            $('<span>').addClass('closer').text('x')
          );
        $notification.append($titleBar);
      }
      
      $notification.append(
        $('<div>').addClass('message')
          .html(message)
      );
      
      $notification.click(function(ev) {
        if ($(ev.target).is('.closer') || options.passive)
          $(this).jKnotifyClose(); 
      });
      if (options.timeout) 
        setTimeout(function() { $notification.jKnotifyClose(); }, options.timeout);
      

      if (options.closeOnButtonClick) {
        $('input[type=submit], input[type=button], button', $notification).click(function() {
          $notification.jKnotifyClose();
        });
      }
      
      if (options.collapse) {
        // essentially a mutex that locks the mouse enter 
        // uncollapse command if we are current waiting 
        // for a collapse (mouse has exited, but collapse
        // still pending)
        var waiting = true;
        
        collapse_timer = setTimeout(function() { 
            waiting = false;
            window.jKnotify.collapse($notification);
          }, options.collapse);
          
        $notification.mouseleave(function() {
          waiting = true;
          clearTimeout(collapse_timer);
          collapse_timer = setTimeout(function() { 
            waiting = false;
            window.jKnotify.collapse($notification);
          }, 1000);
        }).mouseenter(function() {
          clearTimeout(collapse_timer);
          if (waiting) { 
            waiting = false;
            return;
          }
          window.jKnotify.uncollapse($notification);
        });
      }
      


      
      $notification.hide();
      $area.prepend($notification);
      window.jKnotify.open($notification);
    })();
    return $notification;
    
  };
})(jQuery);