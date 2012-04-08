/*
 * $.jKnotifyUi
 * (C) 2011 Mark Watkinson <markwatkinson@gmail.com>
 * 
 * License: BSD
 */


/*Copyright (c) 2011 Mark Watkinson
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Mark Watkinson BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function($) {    
  $.jKnotifyUi = function() {
    var $n = $('<div>'), // The notification's body.
        $e = $n,  // reference to the element to append items to. We might
                  // replace this with a form.
        form = false,
        $handle = null, // handle to the notification, will be returned by
                        // $.kNotify.
        options = {closeOnButtonClick:false, passive:false, closable:false},
        inputs = {},      // input elements keyed by their given name
        cb = null,       // callback to fire when the form is closed
        state = null,    // build state -- some elements will be contiguous 
        // (buttons), whereas some will want to be separated with paragraph
        // tags. This records what state we're in.
        p = null;      // current P tag to write onto.
    
    var inputsToMap = function() {
      var map = {}, val, e, key;
      for (key in inputs) {
        if (!inputs.hasOwnProperty(key))
          continue;
        e = inputs[key];
        if (e.is(':checkbox')) {
          val = !!e.attr('checked');
        } else {
          val = inputs[key].val();
        }
        if (typeof(val) === 'undefined') {
          val = '';
        }
        map[key] = val;
      }
      return map;
    }
    /**
     * @param {string=} newstate
     */
    var changeState = function(newstate) {
      if (state !== newstate) {
        if (typeof newstate !== 'undefined')
          state = newstate;
        p = $('<p>');
      }
      return p;
    }
    
    
    $n.jK = {};      
    
    $n.jK.form = function(method, action) {
      form = true;
      $e = $('<form>').attr('method', method).attr('action', action);
      $n.append($e);
      return $n;
    }
    
    /**
     * @param {*=} value
     */
    $n.jK.close = function(value) {
      if (cb && typeof value !== 'undefined')
        cb(value);
      if ($handle !== null) 
        $handle.jKnotifyClose();     
      return $n;
    }
    $n.jK.icon = function(icon) {
      options.icon = icon;
      return $n;
    }
    $n.jK.title = function(title) {
      options.title = title;
      return $n;
    }      
    $n.jK.callback = function(cb_) {
      cb = cb_;
      return $n;
    };
    
    $n.jK.text = function(text) {
      $e.append(changeState().text(text));
      return $n;
    };
    
    $n.jK.toggleInput = function(text, name, checked) {
      var $i = $('<input type=checkbox>').attr('checked', !!checked);
      $i.data('jKdefault', !!checked);
      inputs[name] = $i;
      $e.append(
        changeState().append(
          $('<label>').text(text).append($i)
        )
      );
      return $n;
    }
    
    $n.jK.selectInput = function(text, name, selections, default_,
        changeOnClick) {
      var $i = $('<select>');
      if (changeOnClick) {
        $i.change(function() {$n.jK.close(inputsToMap());} );
      }
      for (var key in selections) {
        if (!selections.hasOwnProperty(key))
          continue;
        $i.append( 
          $('<option>').text(selections[key])
                       .val(key)
                       .attr('selected', default_ === key)
        );
      };        
      $i.data('jKdefault', default_);
      inputs[name] = $i;
      $e.append(
        changeState().append(
          $('<label>').text(text).append($i)
        )
      );
      return $n;
    }
    
    $n.jK.textInput = function(text, name, options) {
      options = $.extend(true,  {
        closeOnEnter: true,
        password: false,
        def: ''
      }, options);
      var $i = $('<input type="' + ((options.password)? 'password' : 'text')
        + '">').data('jKdefault', options.def);
      $i.val($i.data('jKdefault'));
        
      inputs[name] = $i;
      if (options.closeOnEnter) {
        $i.keypress(function(e) {
          if (e.keyCode == 13) 
            $n.jK.close(inputsToMap());
        });
      }
      $e.append($('<label>').text(text).append($i));
      return $n;
    };
    // Type may be: yes, no, submit, cancel or reset (clears all input elements)
    $n.jK.button = function(text, type) {
      var cbs = {
        yes: function() { $n.jK.close(true); },
        no: function() { $n.jK.close(false); },
        submit: function() { $n.jK.close(inputsToMap()); },
        cancel: function(){ $n.jK.close(); },
        reset: function(){
          $.each(inputs, function(i, inp) {
            if (inp.is(':text') || inp.is(':password'))
              inp.val(inp.data('jKdefault'));
            else if (inp.is(':checkbox')) 
              inp.attr('checked', inp.data('jKdefault'));
            else if (inp.is('select')) {                
              $('option:selected', inp).attr('selected', false);
              // escape the selector.
              var d = inp.data('jKdefault').replace(/[!"#$%&'()*+,\.\/:;?@\[\\\]^`{|}~)]/g, '\\$0');
              $('option[value="' + d + '"]').attr('selected', true);
            }
          });
        }
      }
      var $i = $('<input type="' + ( (type == 'submit')? 'submit' : 'button') + '">').attr('value', text);
      $i.click(function() {
        if (cbs[type])
          cbs[type]();
      });
      $e.append(changeState('button').append($i));
      return $n;
    }
    $n.jK.closable = function(c) {
      options.closable = c;
      return $n;
    };
    
    $n.jK.finish = function() {
      if (form) {
        for (var n in inputs) {
          if (!inputs.hasOwnProperty(n))
            continue;
          inputs[n].attr('name', n);
        }
      }
      $handle = $.jKnotify($n, options);
      return $n;
    }
    return $n;      
  }
  
})(jQuery);