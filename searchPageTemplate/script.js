$(document).ready(function(){


	$('#btnSearch').click(function(){
		var searchType = $('#searchControl').find('.active input:radio').val();
		if (searchType === 'Words'){
				Search();
		}
		return false;
	});

	function ShowResults(r){
		var results = JSON.parse(r).result;

		$('#resultsDiv').empty();

		if(results && results.length){
			$('<div>',{ class:'alert alert-info fade in', html:
			results.length+' results found'}).appendTo($('#resultsDiv'));
			// If results were returned, add them to a pageContainer div,
			// after which append them to the #resultsDiv:

			var pageContainer = $('<div>',{className:'pageContainer'});

			for(var i=0;i<results.length;i++){
				// Creating a new result object and firing its toString method:
					pageContainer.append((i+1) + ')' + new result(results[i]) + '');
			}

			pageContainer.append('<div class="clear"></div>')
						 .hide().appendTo(resultsDiv)
						 .fadeIn('slow');
		}
		else {
			$('<p>',{className:'notFound',html:'No Results Were Found!'}).hide().appendTo($('#resultsDiv')).fadeIn();
		}
	}

	function Search(settings){
		var salaryArray = $( "#price-amount, #price-amount1" ).val().split('-');
		var params;
		if ($( "#chbFilterSalary span" ).attr('class') === 'checked'){
			$.post('/search', {
				'query': $('#txbInput').val(),
				'minSalary': salaryArray[0],
				'maxSalary': salaryArray[1],
				'keywords': $.map($('.tag span'),function(e,i){return $(e).text().trim();})
			}, function(r){
				ShowResults(r);
			});
		}
		else{
			$.post('/search', {
				'query': $('#txbInput').val(),
				'keywords': $.map($('.tag span'),function(e,i){return $(e).text().trim();})
			}, function(r){
				ShowResults(r);
			});
		}
	}

	function result(r, index){

		// This is class definition. Object of this class are created for
		// each result. The markup is generated by the .toString() method.

		var arr = [];

		var json = r.id[0].json

		arr = [
			'<li>',
			'<h6><a href="', json.alternate_url,'">', json.name, '</a></h6>',
			'<a href="', json.area.alternate_url, '" class="result-url">', json.area.name, ' </a>',
			'<a href="', json.employer.alternate_url, '" class="result-url">', json.employer.name, '</a>',
			'<p><strong>Требования: </strong>', json.snippet.requirement,'</p>',
			'<p><strong>Обязанности: </strong>', json.snippet.responsibility,'</p>',
			'</li>'
		];
		this.toString = function(){
			return arr.join('');
		}
	}
});
