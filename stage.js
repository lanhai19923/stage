(function() {
    var stage = function (opts){
        this.headNodeId = -1;
        this.allNodes = this.translateIntoNodeList([]);
        this.debug = opts.debug;
        this.currentNodeId = (!!opts.basicId && !isNaN(opts.basicId))?opts.basicId:0;
    };
    stage.prototype.createNode = function (opts) {
        if (opts == undefined) {
            opts = {};
        }
        opts.stage = this;
        opts.nodeId = this.currentNodeId;
        this.currentNodeId++;
        return new nodeObj(opts);
    };
    stage.prototype.removeNode = function (nodeId) {
        var stage = this;
        var thisNode = this.$(nodeId);
        var thisNodeArr = this.getPreOrderArr(nodeId);
        var parentNode = this.$(thisNode.parentNodeId);
        if (!!parentNode && this.isNodeObj(parentNode)) {
            parentNode.childNodeIds = _.without(parentNode.childNodeIds,nodeId);
            _.each(parentNode.childNodeIds,function(val){
                if(stage.$(val).index > thisNode.index) {
                    stage.$(val).index--;
                }
            });
        }
        _.each(thisNodeArr,function(val){delete stage.allNodes[val.nodeId];});
        this.allNodes.nodeListNodeIds = _.difference(this.allNodes.nodeListNodeIds,_.pluck(thisNodeArr, 'nodeId'));
        this.allNodes.length = this.allNodes.nodeListNodeIds.length;
        if (stage.headNodeId == nodeId) {
            stage.headNodeId = -1;
        }
    };
    stage.prototype.getById = function (id) {
        var node = _.find(this.allNodes,function(val,key){return val.id == id;});
        return !!node?node:false;
    };
    stage.prototype.getByNodeId = function (nodeId) {
        var node = this.allNodes[nodeId];
        return !!node?node:false;
    };
    stage.prototype.$ = function (arg) {
        if (isNaN(arg)) {
            return this.getById(arg);
        } else {
            return this.getByNodeId(arg);
        }
    };
    stage.prototype.dir = function () {
        if (this.headNodeId == -1) {
            return false;
        }
        return this.buildTree(this.headNodeId);
    };
    stage.prototype.buildTree = function (nodeId) {
        var thisNode = this.$(nodeId);
        var childNodeIds = thisNode.childNodeIds;
        var childNodes = [];
        for (var i = 0; i < childNodeIds.length; i++) {
            var childNode = this.buildTree(childNodeIds[i]);
            childNodes.push(childNode);
        }
        return {
            "nodeId": nodeId,
            "childNodes": childNodes
        };
    };
    stage.prototype.isNodeObj = function (obj) {
        if (!!obj) {
            return obj.constructor == nodeObj;
        } else {
            return false;
        }
    };
    stage.prototype.isNodeList = function (obj) {
        if (!!obj) {
            return obj.constructor == nodeList;
        } else {
            return false;
        }
    };
    stage.prototype.getPreOrderArr = function (nId) {
        var stage = this;
        stage.preOrderArr = [];
        nId = !!nId?nId:stage.headNodeId;
        preOrder(nId);
        function preOrder (nodeId) {
            var thisNodeId = nodeId;
            var thisNode = stage.$(nodeId);
            stage.preOrderArr.push(thisNode);
            for (var i = 0;i < thisNode.childNodeIds.length; i++) {
                //确保index升序
                preOrder(_.find(thisNode.childNodeIds,function(nodeid) {return stage.$(nodeid).index == i;}));
            }
        }
        return stage.preOrderArr;
    };
    stage.prototype.translateIntoNodeObj = function (obj) {
        var me = this;
        function intoNodeObj () {
            nodeObj.call(this,{
                stage: me,
                nodeId: me.currentNodeId
            });
            me.currentNodeId++;
        }
        intoNodeObj.prototype = Object.create(obj);
        intoNodeObj.prototype.constructor = nodeObj;
        nodeObjProtos = _.keys(nodeObj.prototype);
        for (var i = 0; i < nodeObjProtos.length; i++) {
            intoNodeObj.prototype[nodeObjProtos[i]] = nodeObj.prototype[nodeObjProtos[i]];
        }
        return new intoNodeObj();
    };
    stage.prototype.translateIntoNodeList = function (nodeArr) {
        return new nodeList(nodeArr);
    };
    stage.prototype.console = function (text) {
        if (this.debug) {
            console.log(text);
        }
    };
    var nodeObj = function (opts) {
        this.stage = opts.stage;
        this.nodeId = opts.nodeId;
        this.parentNodeId = !!opts.parentNodeId ? opts.parentNodeId : -1;
        this.childNodeIds = !!opts.childNodeIds ? opts.childNodeIds : [];
        this.index = !!opts.index ? opts.index : -1;
    };
    nodeObj.prototype.insertBefore = function (arg) {
        var me = this;
        var stage = me.stage;
        if (!arg) {
            //没有传参
            var node = undefined;
        } else if (!isNaN(arg)) {
            //参数为nodeId
            var node = stage.$(arg);

        } else if (stage.isNodeObj(arg)) {
            //参数为nodeObj
            var node = arg;
        } else {
            //错误参数
            var node = false;
        }
        if (node == undefined && stage.headNodeId == -1) {
            stage.headNodeId = me.nodeId;
            stage.allNodes[me.nodeId] = me;
            stage.allNodes.nodeListNodeIds.push(me.nodeId);
            stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            me.index = 0;
        } else if (!!stage.$(node.nodeId)) {
            var parentNode = stage.$(node.parentNodeId);
            if (stage.isNodeObj(parentNode)) {
                var this_index = node.index;
                _.each(parentNode.childNodeIds,function(val){
                    var x_node = me.stage.$(val);
                    if (x_node.index >= this_index) {
                        x_node.index++;
                    }
                });
                me.index = this_index;
                me.parentNodeId = parentNode.nodeId;
                stage.allNodes[me.nodeId] = me;
                stage.allNodes.nodeListNodeIds.push(me.nodeId);
                stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
                parentNode.childNodeIds.push(me.nodeId);
            } else {
                stage.console("参数为根节点，无法执行insertBefore方法");
                return false;
            }
        } else {
            stage.console("参数错误");
        }
    };
    nodeObj.prototype.insertAfter = function (arg) {
        var me = this;
        var stage = me.stage;
        if (!arg) {
            //没有传参
            var node = undefined;
        } else if (!isNaN(arg)) {
            //参数为nodeId
            var node = stage.$(arg);
        } else if (stage.isNodeObj(arg)) {
            //参数为nodeObj
            var node = arg;
        } else {
            var node = false;
        }
        if (node == undefined && stage.headNodeId == -1) {
            stage.headNodeId = me.nodeId;
            stage.allNodes[me.nodeId] = me;
            stage.allNodes.nodeListNodeIds.push(me.nodeId);
            stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            me.index = 0;
        } else if (!!stage.$(node.nodeId)) {
            var parentNode = stage.$(node.parentNodeId);
            if (stage.isNodeObj(parentNode)) {
                var this_index = node.index + 1;
                _.each(parentNode.childNodeIds,function(val){
                    var x_node = me.stage.$(val);
                    if (x_node.index >= this_index) {
                        x_node.index++;
                    }
                });
                me.index = this_index;
                me.parentNodeId = parentNode.nodeId;
                stage.allNodes[me.nodeId] = me;
                stage.allNodes.nodeListNodeIds.push(me.nodeId);
                stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
                parentNode.childNodeIds.push(me.nodeId);
            } else{
                stage.console("参数为根节点，无法执行insertAfter方法");
                return false;
            }
        } else {
            stage.console("参数错误");
        }
    };
    nodeObj.prototype.prepend = function (arg) {
        var me = this;
        var stage = me.stage;
        if (!isNaN(arg)) {
            //参数为nodeId
            var node = stage.$(arg);
        } else if (stage.isNodeList(arg)) {
            //参数为nodeList
            var nodeList = arg;
        } else if (stage.isNodeObj(arg)) {
            //参数为nodeObj
            var node = arg;
        } else {
            var node = false;
            var nodeList = false;
        }
        if (!!node) {
            _.each(me.childNodeIds,function(val){
                var x_node = me.stage.$(val);
                x_node.index++;
            });
            node.index = 0;
            node.parentNodeId = me.nodeId;
            stage.allNodes[node.nodeId] = node;
            stage.allNodes.nodeListNodeIds.push(node.nodeId);
            stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            me.childNodeIds.push(node.nodeId);
        } else if (!!nodeList) {
            _.each(me.childNodeIds,function(val){
                var x_node = stage.$(val);
                x_node.index++;
            });
            var headNode = nodeList.getHeadNode();
            headNode.index = 0;
            headNode.parentNodeId = me.nodeId;
            me.childNodeIds.push(headNode.nodeId);
            _.each(nodeList.nodeListNodeIds,function(val,key){
                stage.allNodes[val] = nodeList[val];
                stage.allNodes.nodeListNodeIds.push(val);
                stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            });
        } else {
            this.console("参数错误");
        }
    };
    nodeObj.prototype.append = function (arg) {
        var me = this;
        var stage = me.stage;
        if (!isNaN(arg)) {
            //参数为nodeId
            var node = stage.$(arg);
        } else if (stage.isNodeList(arg)) {
            var nodeList = arg;
        } else if (stage.isNodeObj(arg)) {
            //参数为nodeObj
            var node = arg;
        } else {
            var node = false;
            var nodeList = false;
        }
        if (!!node) {
            node.index = me.childNodeIds.length;
            node.parentNodeId = me.nodeId;
            stage.allNodes[node.nodeId] = node;
            stage.allNodes.nodeListNodeIds.push(node.nodeId);
            stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            me.childNodeIds.push(node.nodeId);
        } else if (!!nodeList) {
            var headNode = nodeList.getHeadNode();
            headNode.index = 0;
            headNode.parentNodeId = me.nodeId;
            me.childNodeIds.push(headNode.nodeId);
            _.each(nodeList.nodeListNodeIds,function(val,key){
                stage.allNodes[val] = nodeList[val];
                stage.allNodes.nodeListNodeIds.push(val);
                stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            });
        }
    };
    nodeObj.prototype.clone = function(flag) {
        if(flag) {
            var nodeArr = [];
            cloneNodeList(this);
            return this.stage.translateIntoNodeList(nodeArr);
        } else {
            return cloneNode(this);
        }
        function cloneNodeList (node,parentNode) {
            var thisNode = cloneNode(node);
            if (!parentNode) {
                thisNode.index = 0;
                thisNode.parentNodeId = -1;
            } else {
                thisNode.index = node.index;
                thisNode.parentNodeId = parentNode.nodeId;
                parentNode.childNodeIds.push(thisNode.nodeId);
            }
            nodeArr.push(thisNode);
            _.each(node.childNodeIds,function(val){
                cloneNodeList(node.stage.$(val),thisNode);
            });
        }
        function cloneNode(node) {
            var newNode = node.stage.createNode({
                id: !!node.id?node.id+"+":node.id,
                tagName: node.tagName,
                className: node.className,
                classList: node.classList.slice(),
                style: _.pick(node.style,function(){return true;}),
                attributes: _.pick(node.attributes,function(){return true;}),
                eventList: _.pick(node.eventList,function(){return true;}),
                isGroupHead: node.isGroupHead,
                groupName: node.groupName,
                groupHeadNodeId: node.groupHeadNodeId
            });
            return newNode;
        }
    };
    nodeObj.prototype.remove = function() {
        this.stage.removeNode(this.nodeId);
    };
    nodeObj.prototype.clear = function() {
        var thisNode = this;
        for (var i = 0; i < thisNode.childNodeIds.length; i++) {
            thisNode.stage.removeNode(thisNode.childNodeIds[i]);
            i--;
        }
    };
    nodeObj.prototype.next = function() {
        var thisNode = this;
        if(!thisNode.stage.isNodeObj(thisNode.stage.$(thisNode.parentNodeId))) {
            thisNode.stage.console("此节点是根节点，没有后一个节点");
        }else{
            var siblingsNodeIds = thisNode.stage.$(thisNode.parentNodeId).childNodeIds;
            nextNodeId = _.find(siblingsNodeIds,function(val){return thisNode.stage.$(val).index == thisNode.index + 1});
            if (!!nextNodeId) {
                return thisNode.stage.$(nextNodeId);
            } else {
                thisNode.stage.console("未找到后一个节点");
                return false;
            }
        }
    };
    nodeObj.prototype.prev = function() {
        var thisNode = this;
        if(!thisNode.stage.isNodeObj(thisNode.stage.$(thisNode.parentNodeId))) {
            thisNode.stage.console("此节点是根节点，没有前一个节点");
        }else{
            var siblingsNodeIds = thisNode.stage.$(thisNode.parentNodeId).childNodeIds;
            prevNodeId = _.find(siblingsNodeIds,function(val){return thisNode.stage.$(val).index == thisNode.index - 1});
            if (!!prevNodeId) {
                return thisNode.stage.$(prevNodeId);
            } else {
                thisNode.stage.console("未找到后一个节点");
                return false;
            }
        }
    };
    var nodeList = function (arr) {
        this.nodeListNodeIds = [];
        this.length = arr.length;
        var me = this;
        //var root = [];
        _.each(arr,function(val){
            me[val.nodeId] = val;
            me.nodeListNodeIds.push(val.nodeId);
            /*if (_.indexOf(_.pluck(arr, 'nodeId'),val.parentNodeId) == -1) {
                root.push(val);
            }*/
        });
        /*_.each(root,function(val){
            val.index = -1;
            val.parentNodeId = -1;
        });*/
    };
    nodeList.prototype.getHeadNode = function () {
        var me = this;
        var headNodeId = _.find(this.nodeListNodeIds,function(val){return me[val].parentNodeId == -1;})
        if (headNodeId != undefined) {
            return this[headNodeId];
        } else {
            return false;
        }
    };
    nodeList.prototype.insertBefore = function (arg) {
        var me = this;
        if (me.length == 0) {
            return false;
        }
        var headNode = me.getHeadNode();
        var stage = headNode.stage;
        if (!arg) {
            //没有传参
            var node = undefined;
        } else if (!isNaN(arg)) {
            //参数为nodeId
            var node = stage.$(arg);
        } else if (stage.isNodeObj(arg)) {
            //参数为nodeObj
            var node = arg;
        } else {
            var node = false;
        }
        
        if (node == undefined && stage.headNodeId == -1) {
            stage.headNodeId = headNode.nodeId;
            headNode.index = 0;
            pushInAllNodes();
        } else if (!!stage.$(node.nodeId)) {
            var parentNode = stage.$(node.parentNodeId);
            if (stage.isNodeObj(parentNode)) {
                var this_index = node.index;
                _.each(parentNode.childNodeIds,function(val){
                    var x_node = stage.$(val);
                    if (x_node.index >= this_index) {
                        x_node.index++;
                    }
                });
                headNode.index = this_index;
                headNode.parentNodeId = parentNode.nodeId;
                pushInAllNodes();
                parentNode.childNodeIds.push(headNode.nodeId);
            } else {
                this.console("参数为根节点，无法执行insertBefore方法");
                return false;
            }
        } else {
            this.console("参数错误");
        }
        function pushInAllNodes () {
            _.each(me.nodeListNodeIds,function(val){
                stage.allNodes[val] = me[val];
                stage.allNodes.nodeListNodeIds.push(val);
                stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            });
        }
    };
    nodeList.prototype.insertAfter = function (arg) {
        var me = this;
        if (me.length == 0) {
            return false;
        }
        var headNode = me.getHeadNode();
        var stage = headNode.stage;
        if (!arg) {
            //没有传参
            var node = undefined;
        } else if (!isNaN(arg)) {
            //参数为nodeId
            var node = stage.$(arg);
        } else if (stage.isNodeObj(arg)) {
            //参数为nodeObj
            var node = arg;
        } else {
            var node = false;
        }
        if (node == undefined && stage.headNodeId == -1) {
            stage.headNodeId = headNode.nodeId;
            headNode.index = 0;
            pushInAllNodes();
        } else if (!!stage.$(node.nodeId)) {
            var parentNode = stage.$(node.parentNodeId);
            if (stage.isNodeObj(parentNode)) {
                var this_index = node.index + 1;
                _.each(parentNode.childNodeIds,function(val){
                    var x_node = stage.$(val);
                    if (x_node.index >= this_index) {
                        x_node.index++;
                    }
                });
                headNode.index = this_index;
                headNode.parentNodeId = parentNode.nodeId;
                pushInAllNodes();
                parentNode.childNodeIds.push(headNode.nodeId);
            } else {
                this.console("参数为根节点，无法执行insertAfter方法");
                return false;
            }
        } else {
            this.console("参数错误");
        }
        function pushInAllNodes () {
            _.each(me.nodeListNodeIds,function(val){
                stage.allNodes[val] = me[val];
                stage.allNodes.nodeListNodeIds.push(val);
                stage.allNodes.length = stage.allNodes.nodeListNodeIds.length;
            });
        }
    };
    nodeList.prototype.each = function (func) {
        var me = this;
        _.each(me.nodeListNodeIds,function(val){
            var node = me[val];
            func(node);
        });
    };
    nodeList.prototype.find = function (func) {
        var re;
        this.each(function(node){
            if (func(node)) re = node;
        })
        return re;
    };
    nodeList.prototype.filter = function (func) {
        var arr = [];
        this.each(function(node){
            if (func(node)) arr.push(node);
        })
        return arr;
    };
    window.stage = stage;
}());
/****************************以上为stage.js核心功能代码*****************************/