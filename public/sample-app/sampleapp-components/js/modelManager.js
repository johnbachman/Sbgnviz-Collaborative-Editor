/*
 *	Shared model handling operations.
 *  Clients call these commands to update the model
 *	Author: Funda Durupinar Babur<f.durupinar@gmail.com>
 */
module.exports =  function(model) {


    var user = model.at('users.' + model.get('_session.userId'));
    var userName = user.get('name');

    return{
        getModel: function(){
            return model;
        },
        updateLayoutProperties: function(defaultLayoutProperties){

            var currentLayoutProperties;
            var lp =  model.get('_page.doc.layoutProperties');
            if(lp == null)
                currentLayoutProperties = _.clone(defaultLayoutProperties);
            else
                currentLayoutProperties = _.clone(lp);

            model.set('_page.doc.layoutProperties', currentLayoutProperties); //synclayout


            return currentLayoutProperties;
        },
        setLayoutProperties: function(layoutProperties){
            model.set('_page.doc.layoutProperties', layoutProperties); //synclayout

        },
        getSampleInd: function(){
            var ind = model.get('_page.doc.sampleInd');
            if(ind == null)
                ind = "0";
            this.setSampleInd(ind);

            return ind;

        },
        setSampleInd: function(ind){
            model.pass({user:"me"}).set('_page.doc.sampleInd', ind);
        },

        updateHistory: function(opName, elId, param){
            var command = {userName: userName,name: opName, id: elId, param: param, time: new Date};

            if(param == Number(param)){
                param = preciseRound(param, 3);
            }
            else{
                for(var att in param){
                    if(param[att] === Number(param[att]))
                        param[att] = preciseRound(param[att], 3);
                }
            }

            command.param = param;
            model.push('_page.doc.history',command);

        },

        getHistory: function(){
            return model.get('_page.doc.history');

        },

        selectModelNode: function(node){

            var nodePath = model.at('_page.doc.cy.nodes.'  +node.id());
            if(nodePath.get('id') && user){
                nodePath.set('highlightColor' , user.get('colorCode'));

            }

        },

        unselectModelNode: function(node){
            var nodePath = model.at('_page.doc.cy.nodes.'  +node.id());

            if(nodePath.get('id')){
                nodePath.set('highlightColor' , null);
                this.updateServerGraph();
            }

        },
        moveModelNode: function(node){
            var nodePath = model.at('_page.doc.cy.nodes.'  +node.id());
            if(nodePath.get('id')){
                // if(!node.selected) //selected nodes will still be highlighted even if they are freed
                nodePath.set('highlightColor' , null);
                nodePath.set('position' , node.position());
                this.updateServerGraph();
            }


            this.updateHistory('move', node.id(), coordinateRound(node.position(), 3));

        },
        addModelNode: function(nodeId,  param, user){
          //  var pos = {x: param.x, y: param.y};


            model.pass({user:user}).set('_page.doc.cy.nodes.' +nodeId+'.id', nodeId);
            model.pass({user:user}).set('_page.doc.cy.nodes.' +nodeId +'.position', {x: param.x, y: param.y});

            //Adding the node
            model.pass({user:user}).set('_page.doc.cy.nodes.' + nodeId+'.sbgnclass', param.sbgnclass);

            //Initialization
        /*    model.pass({user:user}).set('_page.doc.cy.nodes.' + node.id() +'.highlightColor', null);
            model.pass({user:user}).set('_page.doc.cy.nodes.' + node.id() + '.backgroundColor', node.css('background-color'));
            model.pass({user:user}).set('_page.doc.cy.nodes.' + node.id() + '.borderWidth', node.css('border-width'));
            model.pass({user:user}).set('_page.doc.cy.nodes.' + node.id() + '.borderColor', node.css('border-color'));
*/



            this.updateHistory('add', nodeId, param);

            this.updateServerGraph();
        },


        changeModelNodeAttribute: function(attStr, param, historyData){

            var nodePath = model.at('_page.doc.cy.nodes.'  + param.ele.id());
            if(nodePath.get('id'))
                nodePath.pass({user:"me"}).set(attStr, param.data);

            this.updateServerGraph();

            if(historyData == null)
                this.updateHistory(attStr, param.ele.id(), param.data);
            else
                this.updateHistory(attStr, param.ele.id(), historyData);


        },


        deleteModelNodes: function(selectedNodes){
            for( var i = 0; i < selectedNodes.length; i++ ) {
                var node = selectedNodes[i];
                model.pass({user: "me"}).del(('_page.doc.cy.nodes.' + node.id()));

                this.updateHistory('delete', node.id(), "");


            }

            this.updateServerGraph();


        },

        changeModelEdgeAttribute: function(attStr, param){
            var edgePath = model.at('_page.doc.cy.edges.'  + param.ele.id());
            if(edgePath.get('id'))
                edgePath.pass({user:"me"}).set(attStr, param.data);

            this.updateHistory(attStr, param.ele.id(), param.data);

        },

        selectModelEdge: function(edge){
            var user = model.at('users.' + model.get('_session.userId'));
            var edgePath = model.at('_page.doc.cy.edges.'  +edge.id());
            if(edgePath.get('id') && user)
                edgePath.set('highlightColor' ,user.get('colorCode'));


        },

        unselectModelEdge: function(edge){
            var edgePath = model.at('_page.doc.cy.edges.'  + edge.id());
            if(edgePath.get('id'))
                edgePath.set('highlightColor' , null);

        },


        addModelEdge: function(edge, param, user){

            var command = {userName: user.get('name'), name: 'add', id: edge.id(), param: param, time: new Date};
            model.push('_page.doc.history',command);

            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() +'.id', edge.id());
            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() +'.highlightColor', null);

            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() +'.source', param.source);
            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() +'.target', param.target);

            //Initialization
            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() + '.lineColor', edge.data('lineColor'));
            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() + '.width', edge.css('width'));
            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() + '.cardinality', edge.data('sbgncardinality'));
            model.pass({user:user}).set('_page.doc.cy.edges.' + edge.id() +'.sbgnclass', param.sbgnclass);


            this.updateHistory('add', edge.id(), param);

            this.updateServerGraph();

        },

        deleteModelEdges: function(selectedEdges){
            for( var i = 0; i < selectedEdges.length; i++ ) {
                var edge = selectedEdges[i];
                model.pass({user:"me"}).del(('_page.doc.cy.edges.'  +edge.id()));

                this.updateHistory('delete', edge.id(), "");

            }

            this.updateServerGraph();
        },

        getServerGraph: function(){


            return model.get('_page.doc.jsonObj');
        },

        setServerGraph: function(graph){

            model.set('_page.doc.jsonObj', graph);
        },

        updateServerGraph: function(){
            //TODO: could be simplified to a single node/edge update
            var sbgnmlText = jsonToSbgnml.createSbgnml();
            var cytoscapeJsGraph = sbgnmlToJson.convert(sbgnmlText);
            model.set('_page.doc.jsonObj', cytoscapeJsGraph);
        },

        initModel: function(jsonObj, nodes, edges){

            jsonObj.nodes.forEach(function(node){
                model.set('_page.doc.cy.nodes.' + node.data.id + '.id', node.data.id);
                model.pass({user:"me"}).set('_page.doc.cy.nodes.' + node.data.id + '.position', {x: node.data.sbgnbbox.x, y: node.data.sbgnbbox.y}); //initialize position

            });
            jsonObj.edges.forEach(function(edge){
                model.set('_page.doc.cy.edges.' + edge.data.id + '.id', edge.data.id);
            });

            nodes.forEach(function (node) {



                node.addClass('changeBorderColor');

                var nodePath = model.at('_page.doc.cy.nodes.' + node.id());
                if (nodePath.get('id')) {

                    var width = nodePath.get('width');
                    if (width != null)
                        node.data('width', width);
                    else
                        nodePath.pass({user: "me"}).set('width', node.width());

                    var height = nodePath.get('height');
                    if (height != null)
                        node.data('height', height);
                    else
                        nodePath.pass({user: "me"}).set('height', node.height());


                    var borderWidth = nodePath.get('borderWidth');
                    if (borderWidth != null)
                        node.css('border-width', borderWidth);
                    else
                        nodePath.pass({user: "me"}).set('borderWidth', node.css('border-width'));


                    var borderColor = nodePath.get('borderColor');
                    if (borderColor != null)
                        node.data('borderColor', borderColor);
                    else
                        nodePath.pass({user: "me"}).set('borderColor', node.css('border-color'));


                    var backgroundColor = nodePath.get('backgroundColor');

                    if (backgroundColor != null)
                        node.css('background-color', backgroundColor);
                    else
                        nodePath.pass({user: "me"}).set('backgroundColor', node.css('background-color'));


                    var isCloneMarker = nodePath.get('isCloneMarker');

                    if (isCloneMarker != null)
                        node.data('sbgnclonemarker', isCloneMarker ? true : undefined);

                    else
                        nodePath.pass({user: "me"}).set('isCloneMarker', false);


                    var isMultimer = nodePath.get('isMultimer');

                    if (isMultimer != null) {

                        var sbgnclass = node.data('sbgnclass');
                        if (isMultimer) {
                            //if not multimer already
                            if (sbgnclass.indexOf(' multimer') <= -1) //todo funda changed
                                node.data('sbgnclass', sbgnclass + ' multimer');
                        }
                        else {
                            node.data('sbgnclass', sbgnclass.replace(' multimer', ''));
                        }


                    }

                    else
                        nodePath.pass({user: "me"}).set('isMultimer', false);


                    var parent = nodePath.get('parent');

                    if (parent != null)
                        node.data('parent', parent);
                    else
                        nodePath.pass({user: "me"}).set('parent', node.data('parent'));


                    var sbgnStatesAndInfos = nodePath.get('sbgnStatesAndInfos');
                    if(sbgnStatesAndInfos != null){
                        node.data('sbgnstatesandinfos',sbgnStatesAndInfos);
                    }


                }

            });

            edges.forEach(function (edge) {

                edge.addClass('changeLineColor');

                var edgePath = model.at('_page.doc.cy.edges.' + edge.id());
                if (edgePath.get('id')) {
                    var lineColor = edgePath.get('lineColor');

                    if (lineColor != null)
                        edge.data('lineColor', lineColor);
                    else{
                        edgePath.pass({user:"me"}).set('lineColor', edge.css('line-color'));

                    }

                    var width = edgePath.get('width');
                    if(width != null)
                        edge.css('width', width);
                    else
                        edgePath.pass({user:"me"}).set('width', edge.css('width'));


                    var cardinality = edgePath.get('cardinality');
                    if(cardinality != null)
                        edge.data('sbgncardinality', cardinality);
                    else
                        edgePath.pass({user:"me"}).set('cardinality', edge.data('sbgncardinality'));

                }
            });

        }
    }
}