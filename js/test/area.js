var userAgent = (window.navigator.userAgent).toLocaleLowerCase(),touchEv;
if(userAgent.indexOf("windows") >= 0){  //PC
    touchEv = ["mousedown","mousemove","mouseup","pc"];
}else{  //移动端
    touchEv = ["touchstart","touchmove","touchend","phone"];
}
var uiSelectArea={
    init: function(obj,options){
        var self=this;
        options= $.extend({
            where:'bottom', //弹出方向
            box:'area_select',//弹出信息框id
            aH:30, //每个区域框的高度
            num:5  //最多显示数量
        },options);
        uiPop.init(options.box,true,options.where,function(){ //弹出窗口
            return self._cityCreate(obj,options);
        });
        self._posSet('province',options); //省份位置重置
        self._posSet('city',options); //城市位置重置
        self._posSet('district',options); //地区位置重置
        self._eventAdd(obj,options);
    },
    _posSet: function(type,options){ //设置突出选中项目位置
        var $list=$('#'+options.box+'_'+type);
        var aIndex;
        if($list.find('a.this')&&$list.find('a.this').length>0){
            aIndex=$list.find('a.this').index();
        }else{
            $list.find("a").eq(0).addClass("this");
            aIndex=0
        }
        var top=options.aH*(options.num-1)/2-aIndex*options.aH;
        $list.css('top',top);
    },
    _getLocation: function(obj){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(function(position){
                $.ajax({
                    type:"GET",
                    url:"http://m.kuaidihelp.com/wduser/getUserDirect?latitude="+position.coords.latitude+"&longitude="+position.coords.longitude,
                    dataType: "json",
                    success:function(msg){
                        if(msg){
                            var re = /(.*)市-(.*)-(.*)/i;
                            msg.district_area =  msg.district_area.replace(re,"$1-$2-$3");
                            $(obj).data('pos',msg.district_area);
                            /* var areaArray=msg.district_area.split('-');
                             areaArray[0]=areaArray[0].replace('市','');
                             $(obj).data('pos',areaArray.join('-'));*/
                        }else{
                            $(obj).data('pos','');
                        }
                    }
                });
            },function(e){
                switch(e.code){
                    case 1 :
                        var txt='定位功能被禁用';
                        break;
                    case 2:
                        var txt='未打开定位功能或者网络中断';
                        break;
                    case 3:
                        var txt='超时了';
                        break;
                    default:
                        var txt='未知错误';
                        break;
                }
                uiPop._tip(txt,obj);
            });
        }else{
            uiPop._tip("获取地理位置被拒绝",obj);
        }
    },
    _cityCreate: function(obj,options){  //创建区域列表
        var self=this,reg=/^.+-.+-.+$/;
        var val=$(obj).val();
        var placeVal=$(obj).attr('placeholder');
        val=val==placeVal?'':val;
        val=val&&reg.test(val)?val:"";
        var area=val==''?options.area:val; //重置默认area值
        var proH=self._arrayDeal(1,0,area); //省份
        var proID=proH.ID; //初始省份id
        var cityH=self._arrayDeal(2,proID,area); //城市
        var cityID=cityH.ID; //初始城市id
        var disH=self._arrayDeal(3,cityID,area); //区域
        var boxId=options.box;  //弹出信息框id
        var html='<div class="ui-area-list"><div class="ui-area-line"></div>\
                         <div id="'+boxId+'_touch" class="ui-area-list-insert clearfix">\
                            <div id="'+boxId+'_province" class="ui-area-info">'+proH.html+'</div>\
                            <div id="'+boxId+'_city" class="ui-area-info">'+cityH.html+'</div>\
                            <div id="'+boxId+'_district" class="ui-area-info">'+disH.html+'</div>\
                         </div>\
                      </div>\
                      <div class="ui-area-button clearfix"><input id="'+boxId+'_cancel" type="button" value="取消" /><input id="'+boxId+'_sure" type="button" value="确定" /></div>';
        return html;
    },
    _arrayDeal: function(num,pid,area){ //处理区域数据数组，并返回结果
        /*
         * num: 数组 address[num] 、 pid:pid
         * */
        var defaultArea=(area && area!='')?area.replace(/(^\s+)|(\s+$)/g,"").split('-'):'';
        var newArray=address[num],html='',name,id,defaultID='',className='';
        var defaultName=defaultArea!=''?defaultArea[num-1]:'';
        for(var i in newArray){
            if(newArray[i] && newArray[i].pid==pid){
                name=newArray[i].name;
                id=newArray[i].id;
                if(defaultName == name || defaultName.indexOf(name)>=0 || (defaultName+"市").indexOf(name) >= 0){
                    defaultID=id;
                    className='this';
                }else{
                    className='';
                }
                html=html+ (
                        touchEv[3]== "pc"
                            ?
                        '<a ondragstart="return false" class="'+className+'" data-name="'+name+'" data-id="'+id+'" data-pid="'+pid+'" href="javascript:void(0)">'+name+'</a>'
                            :
                        '<a class="'+className+'" data-name="'+name+'" data-id="'+id+'" data-pid="'+pid+'" href="javascript:void(0)">'+name+'</a>');
            }
        }
        return {html:html,ID:defaultID};
    },
    _eventAdd: function(obj,options){
        var self=this;
        var boxId=options.box; //弹出信息框id
        var $touch = $("#"+boxId+"_touch");
        var start=0,end= 0,index= 0;
        var aH=options.aH; //单个区域高度
        var numCut=(options.num-1)/2; //分割数
        $touch.unbind(touchEv[0]).bind(touchEv[0],function(event){
            self.flag = true;
            stopHandler(event);
            cancelHandler(event);
            var touch = event.touches ? event.touches[0] : {
                "pageX" : event.clientX,
                "pageY" : event.clientY
            };
            self.$touchObj = $(event.target);
            start = touch.pageY; //初始焦点
        });
        if(touchEv[3] == "pc"){
            $touch = $(document);
        }
        $touch.unbind(touchEv[1]).bind(touchEv[1],function(event){
            if(touchEv[3] == "pc" && !self.flag){
                return false;
            }
            stopHandler(event);
            cancelHandler(event);
            var touch = event.touches ? event.touches[0] : {
                "pageX" : event.clientX,
                "pageY" : event.clientY
            };
            var $touchObj=self.$touchObj;
            if($touchObj[0].nodeName.toLocaleLowerCase()!=='a'){return;}
            var $this=$touchObj.parent(); //触摸元素div框
            var $a=$this.find('a');
            var aL=$a.length;
            end = touch.pageY; //单次滑动焦点
            var diff = end - start; //单次滑动距离
            var top = parseInt($this.css('top') || 0);
            var newTop = top + diff;
            index = Math.round(Math.abs((top-numCut*aH))/aH); //获取焦点位置元素的索引
            $a.removeClass('this');
            if((top<-(aL-1)*aH+aH*numCut && diff<0)||(top>aH*numCut && diff>0)){ //可滑动判断
                return false;
            }else {
                $this.css('top', newTop); //定位滑动位置
                $a.eq(index).addClass('this'); //设置指定位置标记
                $this.data('index',index);
                start = end;
            }

        });
        $touch.unbind(touchEv[2]).bind(touchEv[2],function(event){
            self.flag = false;
            stopHandler(event);
            cancelHandler(event);
            var $touchObj=self.$touchObj;
            if($touchObj[0].nodeName.toLocaleLowerCase()!=='a'){return;}
            var $this=$touchObj.parent(); //触摸元素div框
            var $a=$this.find('a'),index=$this.data('index');
            if(typeof index == "undefined"){return false;}
            var $aThis=$a.eq(index);
            $this.css('top',aH*numCut-index*aH);
            $aThis.addClass('this');
            var boxId=$this.attr('id');
            if(boxId.indexOf('province')>0){ //省份滚动选择
                var cityH=self._arrayDeal(2,$aThis.data('id'),'');  //拉取城市列表
                $('#'+options.box+'_city').html(cityH.html);
                var $now=$('#'+options.box+'_city').find('a').eq(0);
                $now.addClass('this');
                var cityID=$now.data('id'); //选中的城市id
                var disH=self._arrayDeal(3,cityID,'');  //拉取区域列表
                $('#'+options.box+'_district').html(disH.html).find('a').eq(0).addClass('this');
                self._posSet('city',options);
                self._posSet('district',options);
            }else if(boxId.indexOf('city')>0){
                $('#'+options.box+'_district').html(self._arrayDeal(3,$aThis.data('id')).html).find('a').eq(0).addClass('this');
                self._posSet('district',options);
            }
        });
        $touch.data('touch',1);
        /*
         * 绑定确认及取消按钮
         * */
        var $cancel=$('#'+boxId+'_cancel');
        var $sure=$('#'+boxId+'_sure');
        $cancel.bind('click',function(){
            var $obj=$(obj),placeV=$obj.attr('placeholder'),val=$obj.val();
            (val==''||placeV==val)?$obj.parent().addClass('ui-erro'):$obj.parent().removeClass('ui-erro');
            uiPop.init(boxId,false,options.where);//关闭弹出窗口
        });
        $sure.bind('click',function(){
            var $obj=$(obj),$inputName=$('#'+$obj.data('id')),$inputId=$('#'+$obj.data('id')+'_id');
            var pro=$('#'+boxId+'_province').find('a.this').data('name');
            var city=$('#'+boxId+'_city').find('a.this').data('name');
            var dis=$('#'+boxId+'_district').find('a.this').data('name');
            $(obj).val(pro+'-'+city+'-'+dis);
            $inputName.length>0?$inputName.val(pro+'-'+city+'-'+dis):'';
            $inputId.length>0?$inputId.val($('#'+options.box+'_district').find('a.this').data('id')):'';
            checkInputInfo.check($obj,'showtip');
            checkInputInfo.init(3,this,$obj.attr('class'));
            uiPop.init(boxId,false,options.where);//关闭弹出窗口
        });
    }
}
function stopHandler(event){ //阻止冒泡
    window.event?window.event.cancelBubble=true:event.stopPropagation();
}
//阻止默认事件
function cancelHandler(event){
    var event = event ||  window.event;
    //用于IE
    if(event.preventDefault) event.preventDefault();
    //标准技术
    if(event.returnValue) event.returnValue = false;
    return false;
}