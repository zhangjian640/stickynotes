/**
 *  @zhangj
 */

// 命名空间模块
var app = {
    util: {},
    store: {}
};

// 工具方法模块
app.util = {
    $: function (selector, node) {
        return (node || document).querySelector(selector);
    },
    formateTime: function (ms) {
        var d= new Date(ms);
        var pad = function (s) {
            if (s.toString().length === 1) {
                s = '0' + s;
            }
            return s;
        };
        var year = d.getFullYear();
        var month = d.getMonth();
        var date = d.getDate();
        var hour = d.getHours();
        var minute = d.getMinutes();
        var second = d.getSeconds();

        return year + '-' + pad(month+1) + '-' + pad(date) + ' ' + pad(hour) + ':' + pad(minute) + ':' + pad(second);
    }
};
// store 模块
app.store = {
    __store_key: '__sticky_key',
    get: function (id) {
        var notes = this.getNotes();
        return notes[id] || {};
    },
    set: function (id, content) {
        var notes = this.getNotes();
        if (notes[id]) {
            Object.assign(notes[id], content);
        } else {
            notes[id] = content;
        }
        localStorage[this.__store_key] = JSON.stringify(notes);
        console.log('saved notes id: ' + id + 'content:' + JSON.stringify(notes[id]));
    },
    remove: function (id) {
        var notes = this.getNotes();
        delete notes[id];
        localStorage[this.__store_key] = JSON.stringify(notes);
    },
    getNotes: function () {
        return JSON.parse(localStorage[this.__store_key] || '{}');
    }
};

(function (util,store) {
    var $ = util.$;
    var movedNote = null;
    var startX;
    var startY;
    var maxZIndex = 0;

    var noteTpl = `
        <i class="u-close"></i>
        <div class="u-editor" contenteditable="true"></div>
        <div class="u-timestamp">
            <span>更新：</span>
            <span class="time"></span>
        </div>
    `;
    
    function Note(options) {
        var note = document.createElement('div');
        note.className = 'm-note';
        note.id = options.id || 'm-note-' + Date.now();
        note.innerHTML = noteTpl;
        $('.u-editor', note).innerHTML = options.content || '';
        note.style.left = options.left + 'px';
        note.style.top = options.top + 'px';
        note.style.zIndex = options.zIndex;
        document.body.appendChild(note);
        this.note = note;
        this.updateTime(options.updateTime);
        this.addEvent();
    }

    Note.prototype.save = function () {
        store.set(this.note.id, {
            left: this.note.offsetLeft,
            top: this.note.offsetTop,
            zIndex: parseInt(this.note.style.zIndex),
            content: $('.u-editor', this.note).innerHTML,
            updateTime: this.updateTimeMS
        })
    };


    Note.prototype.updateTime = function (ms) {
      var ts = $('.time', this.note);
        ms = ms || Date.now();
      ts.innerHTML = util.formateTime(ms);
      this.updateTimeMS = ms;
    };

    Note.prototype.close = function (e) {
        document.body.removeChild(this.note);
    };

    Note.prototype.addEvent = function () {
        // 便签 mousedown事件
        var mousedownHandler = function (e) {
            movedNote = this.note;
            startX = e.clientX- this.note.offsetLeft;
            startY = e.clientY - this.note.offsetTop;

            if (parseInt(this.note.style.zIndex) !== maxZIndex - 1) {
                this.note.style.zIndex = maxZIndex++;
                store.set(this.note.id,{
                    zIndex: maxZIndex-1
                })
            }
        }.bind(this);
        this.note.addEventListener('mousedown', mousedownHandler);

        // 便签的输入事件
        var edtior = $('.u-editor', this.note);

        var inputTimer;

        var  inputHandler= function(e) {
            var content = edtior.innerHTML;
            clearTimeout(inputTimer);
            inputTimer = setTimeout(function () {
                store.set(this.note.id, {
                    content: content
                });
                this.updateTime(Date.now());
            }.bind(this), 300);
        }.bind(this);

        edtior.addEventListener('input', inputHandler);


        // 关闭处理程序
        var closeBtn = $('.u-close', this.note);
        var closeHandler = function (e) {
            store.remove(this.note.id);
            this.close(e);
            closeBtn.removeEventListener('click', closeHandler);
            this.note.removeEventListener('mousedown', closeHandler);
        }.bind(this);

        closeBtn.addEventListener('click', closeHandler);



    };

    document.addEventListener('DOMContentLoaded', function (e) {

        // 创建按钮事件
        $('#create').addEventListener('click', function (e) {
            var note = new Note({
                left: Math.round(Math.random()*(window.innerWidth - 220)),
                top: Math.round(Math.random()*(window.innerHeight - 320)),
                zIndex: maxZIndex++
            });
            note.save();
        });
        function mousemoveHandler(e) {
            if (!movedNote) {
                return;
            }
            movedNote.style.left = e.clientX - startX +'px';
            movedNote.style.top = e.clientY - startY + 'px';
        }

        function mouseupHandler(e) {
            // 存储left和top

            if (!movedNote) {
                return;
            }
            store.set(movedNote.id,{
                left: movedNote.offsetLeft,
                top: movedNote.offsetTop
            })
            movedNote = null;
        }
        // 移动监听
        document.addEventListener('mousemove', mousemoveHandler);
        document.addEventListener('mouseup', mouseupHandler);
        
        // 初始化notes
        var notes = store.getNotes();
        Object.keys(notes).forEach(function (id) {
            var options = notes[id];
            if (maxZIndex < options.zIndex) {
                maxZIndex = options.zIndex;
            }
            new Note(Object.assign(notes[id],{
                id: id
            }));
        })
    })




})(app.util,app.store);
