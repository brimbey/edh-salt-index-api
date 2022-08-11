@app
commandersalt-api

@aws
# profile default
region us-east-1
runtime nodejs16.x
architecture arm64

@http
/import
	method get
	src /api/import
/card
	method get
	src /api/card
/leaderboard
	method get
	src /api/leaderboard
/persist
	method post
	src /api/persist
/stats
	method get
	src /api/stats
/init
	method get
	src /api/init
/import
	method options
	src /api/genericOptionsResponse
/card
	method options
	src /api/genericOptionsResponse
/leaderboard
	method options
	src /api/genericOptionsResponse
/persist
	method options
	src /api/genericOptionsResponse
/stats
	method options
	src /api/genericOptionsResponse
/init
	method options
	src /api/genericOptionsResponse

@tables
data
	category *String
	id **String

@tables-indexes
data
	category *String
	salt **Number
	name bySalt

data
	category *String
	id *String
	name byId

data 
	category *String
	name byStats

data 
	category *String
	search *Map
	name bySearch
