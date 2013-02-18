//
//  main.js
//
//  A project template for using arbor.js
//

(function($){

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d");
    var particleSystem

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
      },
      
      redraw:function(){
        // 
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        // 
        ctx.fillStyle = "white"
        ctx.fillRect(0,0, canvas.width, canvas.height)
        
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0,0,0, .333)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pt1.x, pt1.y)
          ctx.lineTo(pt2.x, pt2.y)
          ctx.stroke()
        })

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = 10
          var color = (node.data.alone) ? "orange" : (node.data.root) ? "blue" : (node.data.color) ? node.data.color : "black"
          ctx.fillStyle = color
          var label = node.data.label || ""          
          if (label){
            ctx.font = "12px Helvetica"
            ctx.fillStyle = color            
            ctx.fillText(label, pt.x-w/2, pt.y-w/2)
          } else {
            ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
          }
        })    			
      },
      
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        
        // start listening
        $(canvas).mousedown(handler.clicked);

      },
      
    }
    return that
  }    



  $(document).ready(function(){
    var sys = arbor.ParticleSystem(500, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

      $.getJSON('data/shoehorn-multi.json', function(data) {
            for (var i in data) {
                sys.addNode(data[i].id, {root: true, label: data[i].headline, links: data[i].links});                
                for (var l in data[i].links) {
                    var node = sys.getNode(data[i].links[l].id);
                    if (node) {
                        sys.addEdge(data[i].id, node, {length: data[i].links[l].length});
                    }                    
                }
            }
      });

        

//    for(x=0; x<json.length; x++){
//        node = json(x)
//        nodes[x] = sys.addNode(node.id, {length: node.length, label: node.headline, links: node.links});
//    }

//    for(x=0; x<nodes.length; x++){
//        var links = nodes[x].links;
//        foreach(link <- links){
//            linkedNode = nodes.filter(_.id == link.id);
//            sys.addEdge(nodes[x].id, linkedNode.id);
//        } 
//    }

//    alert(nodes.id);

    // node a
//    var a = sys.addNode('world/2013/feb/17/oscar-pistorius-cricket-bat', {mass:.50, color:'blue', label:'Oscar Pistorius case: bloodied cricket bat is key evidence, paper claims'});
//    var b = sys.addNode('world/video/2013/feb/18/oscar-pistorius-agent-visits-prison-video', {mass:.50, nodeName: 'foo', color:'green', label:'oscar-pistorius-agent-visits-prison-video'});
//    var c = sys.addNode('sport/2013/feb/17/oscar-pistorius-withdrawn-manchester-city-games', {mass:.50, nodeName: 'foo', color:'green', label:'sport/2013/feb/17/oscar-pistorius-withdrawn-manchester-city-games'});

    // add some nodes to the graph and watch it go...
//    sys.addEdge(a, b)
//    sys.addEdge(a, c)
//    sys.addEdge(c, a)

    //sys.addNode('f', {alone:true, mass:.25})

    // or, equivalently:
    //
    // sys.graft({
    //   nodes:{
    //     f:{alone:true, mass:.25}
    //   }, 
    //   edges:{
    //     a:{ b:{},
    //         c:{},
    //         d:{},
    //         e:{}
    //     }
    //   }
    // })
    
  })


})(this.jQuery)
