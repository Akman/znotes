/* ***** BEGIN LICENSE BLOCK *****
 *
 * Version: GPL 3.0
 *
 * ZNotes
 * Copyright (C) 2015 Alexander Kapitman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The Original Code is ZNotes.
 *
 * Initial Developer(s):
 *   Alexander Kapitman <akman.ru@gmail.com>
 *
 * Portions created by the Initial Developer are Copyright (C) 2015
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

const EXPORTED_SYMBOLS = ["DateUtils"];

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var Cu = Components.utils;

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Cu.import( "resource://znotes/utils.js", ru.akman.znotes );

var DateUtils = function() {

  var Utils = ru.akman.znotes.Utils;
  var log = Utils.getLogger( "modules.dateutils" );

  var _firstDayOfWeek = 0;
  var _dateIntervals = null;

  function setFirstDayOfWeek( value ) {
    if ( typeof( value ) === "number" && (
      value === 0 || value === 1 || value === 2 ||
      value === 3 || value === 4 || value === 5 || value === 6 ) ) {
      _firstDayOfWeek = value;
    }
  };
  
  function getToday( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    start.setHours( 0, 0, 0, 0 );
    end.setDate( start.getDate() + 1 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getYesterday( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    start.setDate( start.getDate() - 1 );
    start.setHours( 0, 0, 0, 0 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getThisWeek( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    var day = start.getDay();
    if ( _firstDayOfWeek > day ) {
      day += 7;
    }
    start.setDate( start.getDate() - day + _firstDayOfWeek );
    start.setHours( 0, 0, 0, 0 );
    end.setDate( start.getDate() + 7 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getLastWeek( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    var day = start.getDay();
    if ( _firstDayOfWeek > day ) {
      day += 7;
    }
    start.setDate( start.getDate() - day + _firstDayOfWeek - 7 );
    start.setHours( 0, 0, 0, 0 );
    end.setDate( start.getDate() + 7 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getThisMonth( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    start.setDate( 1 );
    start.setHours( 0, 0, 0, 0 );
    end.setDate( 32 );
    end.setDate( 1 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getLastMonth( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    start.setDate( 0 );
    start.setDate( 1 );
    start.setHours( 0, 0, 0, 0 );
    end.setDate( 1 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getThisQuarter( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    if ( start.getMonth() > 8 ) {
      start.setMonth( 9, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 12, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else if ( start.getMonth() > 5 ) {
      start.setMonth( 6, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 9, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else if ( start.getMonth() > 2 ) {
      start.setMonth( 3, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 6, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else {
      start.setMonth( 0, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 3, 1 );
      end.setHours( 0, 0, 0, 0 );
    }
    return { start: start, end: end };
  };

  function getLastQuarter( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    if ( start.getMonth() > 8 ) {
      start.setMonth( 6, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 9, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else if ( start.getMonth() > 5 ) {
      start.setMonth( 3, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 6, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else if ( start.getMonth() > 2 ) {
      start.setMonth( 0, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 3, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else {
      start.setMonth( -3, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 0, 1 );
      end.setHours( 0, 0, 0, 0 );
    }
    return { start: start, end: end };
  };

  function getThisHalfYear( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    if ( start.getMonth() > 5 ) {
      start.setMonth( 6, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 12, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else {
      start.setMonth( 0, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 6, 1 );
      end.setHours( 0, 0, 0, 0 );
    }
    return { start: start, end: end };
  };

  function getLastHalfYear( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    if ( start.getMonth() > 5 ) {
      start.setMonth( 0, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 6, 1 );
      end.setHours( 0, 0, 0, 0 );
    } else {
      start.setMonth( -6, 1 );
      start.setHours( 0, 0, 0, 0 );
      end.setMonth( 0, 1 );
      end.setHours( 0, 0, 0, 0 );
    }
    return { start: start, end: end };
  };

  function getThisYear( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    start.setMonth( 0, 1 );
    start.setHours( 0, 0, 0, 0 );
    end.setMonth( 12, 1 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getLastYear( date ) {
    var start = date ? new Date( date ) : new Date();
    var end = new Date( start );
    start.setMonth( -12, 1 );
    start.setHours( 0, 0, 0, 0 );
    end.setMonth( 0, 1 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };

  function getBeforeLastYear( date ) {
    var start = new Date( 0, 0, 0, 0, 0, 0, 0 );
    var end = date ? new Date( date ) : new Date();
    end.setMonth( -12, 1 );
    end.setHours( 0, 0, 0, 0 );
    return { start: start, end: end };
  };
  
  function TodayInterval() {
    this.constructor = DateIntervals;
  };
  TodayInterval.prototype = {
    toString: function() {
      return "today";
    },
    range: function( date ) {
      return getToday( date );
    },
    check: function( date ) {
      var range = getToday();
      return date >= range.start && date < range.end;
    }
  };

  function YesterdayInterval() {
    this.constructor = DateIntervals;
  };
  YesterdayInterval.prototype = {
    toString: function() {
      return "yesterday";
    },
    range: function( date ) {
      return getYesterday( date );
    },
    check: function( date ) {
      var range = getYesterday();
      return date >= range.start && date < range.end;
    }
  };

  function ThisWeekInterval() {
    this.constructor = DateIntervals;
  };
  ThisWeekInterval.prototype = {
    toString: function() {
      return "thisweek";
    },
    range: function( date ) {
      return getThisWeek( date );
    },
    check: function( date ) {
      var range = getThisWeek();
      return date >= range.start && date < range.end;
    }
  };

  function LastWeekInterval() {
    this.constructor = DateIntervals;
  };
  LastWeekInterval.prototype = {
    toString: function() {
      return "lastweek";
    },
    range: function( date ) {
      return getLastWeek( date );
    },
    check: function( date ) {
      var range = getLastWeek();
      return date >= range.start && date < range.end;
    }
  };

  function ThisMonthInterval() {
    this.constructor = DateIntervals;
  };
  ThisMonthInterval.prototype = {
    toString: function() {
      return "thismonth";
    },
    range: function( date ) {
      return getThisMonth( date );
    },
    check: function( date ) {
      var range = getThisMonth();
      return date >= range.start && date < range.end;
    }
  };

  function LastMonthInterval() {
    this.constructor = DateIntervals;
  };
  LastMonthInterval.prototype = {
    toString: function() {
      return "lastmonth";
    },
    range: function( date ) {
      return getLastMonth( date );
    },
    check: function( date ) {
      var range = getLastMonth();
      return date >= range.start && date < range.end;
    }
  };
  
  function ThisQuarterInterval() {
    this.constructor = DateIntervals;
  };
  ThisQuarterInterval.prototype = {
    toString: function() {
      return "thisquarter";
    },
    range: function( date ) {
      return getThisQuarter( date );
    },
    check: function( date ) {
      var range = getThisQuarter();
      return date >= range.start && date < range.end;
    }
  };

  function LastQuarterInterval() {
    this.constructor = DateIntervals;
  };
  LastQuarterInterval.prototype = {
    toString: function() {
      return "lastquarter";
    },
    range: function( date ) {
      return getLastQuarter( date );
    },
    check: function( date ) {
      var range = getLastQuarter();
      return date >= range.start && date < range.end;
    }
  };
  
  function ThisHalfYearInterval() {
    this.constructor = DateIntervals;
  };
  ThisHalfYearInterval.prototype = {
    toString: function() {
      return "thishalfyear";
    },
    range: function( date ) {
      return getThisHalfYear( date );
    },
    check: function( date ) {
      var range = getThisHalfYear();
      return date >= range.start && date < range.end;
    }
  };

  function LastHalfYearInterval() {
    this.constructor = DateIntervals;
  };
  LastHalfYearInterval.prototype = {
    toString: function() {
      return "lasthalfyear";
    },
    range: function( date ) {
      return getLastHalfYear( date );
    },
    check: function( date ) {
      var range = getLastHalfYear();
      return date >= range.start && date < range.end;
    }
  };

  function ThisYearInterval() {
    this.constructor = DateIntervals;
  };
  ThisYearInterval.prototype = {
    toString: function() {
      return "thisyear";
    },
    range: function( date ) {
      return getThisYear( date );
    },
    check: function( date ) {
      var range = getThisYear();
      return date >= range.start && date < range.end;
    }
  };

  function LastYearInterval() {
    this.constructor = DateIntervals;
  };
  LastYearInterval.prototype = {
    toString: function() {
      return "lastyear";
    },
    range: function( date ) {
      return getLastYear( date );
    },
    check: function( date ) {
      var range = getLastYear();
      return date >= range.start && date < range.end;
    }
  };

  function BeforeLastYearInterval() {
    this.constructor = DateIntervals;
  };
  BeforeLastYearInterval.prototype = {
    toString: function() {
      return "beforelastyear";
    },
    range: function( date ) {
      return getBeforeLastYear( date );
    },
    check: function( date ) {
      var range = getBeforeLastYear();
      return date < range.end;
    }
  };

  function DateIntervals() {
    this.today = new TodayInterval();
    this.yesterday = new YesterdayInterval();
    this.thisweek = new ThisWeekInterval();
    this.lastweek = new LastWeekInterval();
    this.thismonth = new ThisMonthInterval();
    this.lastmonth = new LastMonthInterval();
    this.thisquarter = new ThisQuarterInterval();
    this.lastquarter = new LastQuarterInterval();
    this.thishalfyear = new ThisHalfYearInterval();
    this.lasthalfyear = new LastHalfYearInterval();
    this.thisyear = new ThisYearInterval();
    this.lastyear = new LastYearInterval();
    this.beforelastyear = new BeforeLastYearInterval();
  };
  DateIntervals.prototype = {
    get firstDayOfWeek() {
      return _firstDayOfWeek;
    },
    set firstDayOfWeek( value ) {
      if ( typeof( value ) === "number" && (
        value === 0 || value === 1 || value === 2 ||
        value === 3 || value === 4 || value === 5 || value === 6 ) ) {
        _firstDayOfWeek = value;
      }
    },
    forEach: function( f ) {
      var that = this;
      Object.keys( this ).forEach( function( name ) {
        f( that[name] );
      } );
    }
  };
  
  var pub = {};
    
  pub.getDateIntervals = function( firstDayOfWeek ) {
    if ( !_dateIntervals ) {
      _dateIntervals = new DateIntervals();
    }
    _dateIntervals.firstDayOfWeek = firstDayOfWeek;
    return _dateIntervals;
  };
  
  return pub;

}();
