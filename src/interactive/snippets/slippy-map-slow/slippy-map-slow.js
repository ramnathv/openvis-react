var SlippyMap = React.createClass({

  propTypes: {
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    center: React.PropTypes.array.isRequired,
  },

  getInitialState() {
    return {
      scale: (1 << 19),
      translate: [-this.props.width / 2, -this.props.height / 2]
    };
  },

  componentDidMount() {
    var {width, height, center} = this.props;
    var {scale, translate} = this.state;

    var projection = this.getProjection();

    var zoom = d3.behavior.zoom()
      .scale(scale)
      .scaleExtent([1 << 18, 1 << 25])
      .translate(projection(center).map(x => -x))
      .on('zoom', this.zoomed);

    d3.select(this.getDOMNode())
      .call(zoom);

    this.zoom = zoom;
    this.zoomed();
  },

  zoomed() {
    this.setState({
      scale: this.zoom.scale(),
      translate: this.zoom.translate()
    });
  },


  getProjection() {
    return d3.geo.mercator()
      .scale(this.state.scale / 2 / Math.PI)
      .translate(this.state.translate);
  },

  getTransform(scale, translate) {
    var k = scale / 256, r = scale % 1 ? Number : Math.round;
    return 'matrix3d(' + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0,
        r(translate[0] * scale), r(translate[1] * scale), 0, 1 ] + ')';
  },

  render() {
    var {width, height} = this.props;
    var {scale, translate} = this.state;

    var projection = this.getProjection();
    var tiler = d3.geo.tile()
        .size([width, height])
        .scale(scale)
        .translate(translate);

    var tiles = tiler();




    return (
      <div className="TileMap" style={{width: width, height: height}}>
        <div className="TileMap-layer"
             style={{transform: this.getTransform(tiles.scale, tiles.translate) }}>
          {tiles.map(d =>
              <RasterTile key={d.join('|')} x={d[0]} y={d[1]} z={d[2]} />
          )}
          {
            tiles.map(d =>
              <VectorTile key={d.join('|')} x={d[0]} y={d[1]} z={d[2]} />
            )
          }
        </div>
      </div>
    );

  }
});







var RasterTile = React.createClass({

  propTypes: {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    z: React.PropTypes.number.isRequired,
  },

  render() {
    var {x, y, z} = this.props;
    return (
      <img className="RasterTile"
           src={'http://a.www.toolserver.org/tiles/bw-mapnik/'+z+'/'+x+'/'+y+'.png'}
           style={{left: x * 256, top: y * 256}}
           width={256} height={256} />
    );
  }

});





var VectorTile = React.createClass({

  propTypes: {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    z: React.PropTypes.number.isRequired
  },

  getInitialState() {
    return { geoms: null };
  },


  getProjection() {
    var {x, y, z} = this.props;
    var k = Math.pow(2, z) * 256; // size of the world in pixels
    return d3.geo.mercator()
      .translate([k / 2 - x * 256, k / 2 - y * 256]) // [0°,0°] in pixels
      .scale(k / 2 / Math.PI);
  },

  render() {
    var {x, y, z} = this.props;

    var tilePath = d3.geo.path()
      .projection(this.getProjection());

    return (
      <svg className="VectorTile" width={256} height={256}
           style={{left: x * 256, top: y * 256}}>
        {!this.state.geoms ? null  :
                  this.state.geoms
                    .map(d => <path key={d.id} d={tilePath(d)}
                                    className={d.properties.kind} />)
        }
      </svg>
    )
  },

  tileUrl() {
    return 'http://a.tile.openstreetmap.us/vectiles-highroad/' +
                   this.props.z + '/' + this.props.x + '/' + this.props.y + '.json';
  },

  componentDidMount() {
    var tile = this;
    this._xhr = d3.json(this.tileUrl(), function(error, json) {
        tile.setState({
          geoms: json.features.sort((a, b) =>
            a.properties.sort_key - b.properties.sort_key
          )
        });
    });
  },

  componentWillUnmount() {
    this._xhr.abort();
  }
});



