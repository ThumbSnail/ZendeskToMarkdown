
var txtEntry = document.getElementById('text-entry');
var btnConvert = document.getElementById('convert');
var divOutput = document.getElementById('output');

btnConvert.addEventListener('click', function() {
	var strText = txtEntry.value;

	var finalText = convertToMarkdown(strText);

	divOutput.innerHTML = finalText;
});

function convertToMarkdown(str) {

	str = replaceAllTag(str, 'strong', '**');	//bold
	str = replaceAllTag(str, 'em', '_');		//italics
	str = replaceAllTag(str, 'div', '');		//div
	str = replaceAllTag(str, 'p', '');			//p
	str = replaceAllTag(str, 'span', '');		//span
	str = convertHeaders(str);					//<h1> thru <h6> to # thru ######
	str = convertLinks(str);					//<a> to [title](link)
	str = replaceAllTag(str, 'blockquote', '<br>> ', '<br><br>&amp;nbsp;', 0, -1, quoteBreaks);	//<quoteblock> and its <br> to <br>> 
															//^For Zendesk Quirk 1, force a break after a quote
	str = replaceAllTag(str, 'ol', '', '<br>', 0, -1, orderedListItems);			//<ol> and <li> to 1. 
	str = replaceAllTag(str, 'ul', '', '<br>', 0, -1, unorderedListItems);			//<ul> and <li> to * 
	str = keepMyDoubleSpaces(str);				//'  ' to &amp;nbsp;

	return str;

	/*  replaceAllTag
	 *  
	 *  Normal Arguments:
	 *  str = string of HTML
	 *  tagName = tag to replace.  Ex:  strong
	 *  markdownOpen = Markdown to replace opening tag with.  Ex:  **  So <strong> becomes **
	 *  markdownClose = Markdown to replace closing tag with.  Ex:  **  So </strong> becomes **
	 *
	 *  Argument that applies to the parent of a parent/child tag combo (ex: <ol> and <li>).
	 *  nestedFn = another replaceAllTag function.  Ex:  within replaceAll<ol>, that will call replaceAll<li>
	 *
	 *  Arguments that apply to the nested function call
	 *  parentTagStart = Ex:  where the parent <ol> is located
	 *  parentTagEnd = Ex:  where the parent </ol> is located.  These are used as boundaries so that an <li>
	 					outside of that range is not removed
	*/
	function replaceAllTag(str, tagName, markdownOpen, markdownClose, parentTagStart, parentTagEnd, nestedFn) {
		markdownClose = typeof markdownClose !== 'undefined' ? markdownClose : markdownOpen;
		parentTagStart = typeof parentTagStart !== 'undefined' ? parentTagStart : 0;
		var wasNested = false;

		if (typeof parentTagEnd !== 'undefined' && parentTagEnd > -1) {
			wasNested = true;
		}

		var tag = '<' + tagName;
		var openTagStartIndex = str.indexOf(tag, parentTagStart);
		var openTagEndIndex;

		while (openTagStartIndex !== -1 && (wasNested ? openTagStartIndex < parentTagEnd : true)) {
			openTagEndIndex = str.indexOf('>', openTagStartIndex) + 1;

			str = str.substring(0, openTagStartIndex) + markdownOpen + str.substring(openTagEndIndex);

			parentTagEnd += openTagStartIndex - openTagEndIndex + markdownOpen.length; //part (removed) + part added

			if (typeof nestedFn !== 'undefined') {
				parentTagEnd = str.indexOf('</' + tagName);  
				str = nestedFn(str, openTagStartIndex + markdownOpen.length, parentTagEnd);
			}			

			var endTag = '</' + tagName + '>';
			str = str.replace(endTag, markdownClose);
			parentTagEnd += markdownClose.length - endTag.length;  //part added - part removed

			openTagStartIndex = str.indexOf(tag, openTagStartIndex + markdownOpen.length);
		}

		return str;
	}

	function convertHeaders(str) {
		var tagName = '';
		var markdown = '';

		for (var i = 1; i <= 6; i++) {
			tagName = 'h' + i;
			markdown += '#';
			str = replaceAllTag(str, tagName, markdown, '<br>');
		}

		return str;
	}

	function convertLinks(str) {
		var anchorStartIndex = str.indexOf('<a');

		while (anchorStartIndex !== -1) {
			var linkStartIndex = str.indexOf('href=\"', anchorStartIndex) + 6;  //length of href="
			var linkEndIndex = str.indexOf('\"', linkStartIndex);
			var strLink = str.substring(linkStartIndex, linkEndIndex);

			var anchorEndIndex = str.indexOf('>', linkEndIndex) + 1;  // a.k.a. titleStartIndex
			var titleEndIndex = str.indexOf('</a>', anchorEndIndex);
			var strTitle = str.substring(anchorEndIndex, titleEndIndex);
			titleEndIndex += 4;  //length of </a>

			str = str.substring(0, anchorStartIndex) + '[' + strTitle + '](' + strLink + ')'
				  + str.substring(titleEndIndex);

			anchorStartIndex = str.indexOf('<a');
		}

		return str;
	}

	function quoteBreaks(str, parentTagStart, parentTagEnd) {
		str = replaceAllTag(str, 'br', '<br>> ', '', parentTagStart, parentTagEnd);
		return str;
	}

	function orderedListItems(str, parentTagStart, parentTagEnd) {
		str = replaceAllTag(str, 'li', '1. ', '<br>', parentTagStart, parentTagEnd);
		return str;
	}

	function unorderedListItems(str, parentTagStart, parentTagEnd) {
		str = replaceAllTag(str, 'li', '* ', '<br>', parentTagStart, parentTagEnd);
		return str;
	}

	function keepMyDoubleSpaces(str) {
		return str.replace(/\&nbsp;/g, '&amp;nbsp;');
	}
}