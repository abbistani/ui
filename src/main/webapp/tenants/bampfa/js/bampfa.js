/*
Copyright 2014 University of California, Berkeley

Licensed under the Educational Community License (ECL), Version 2.0. 
You may not use this file except in compliance with this License.

You may obtain a copy of the ECL 2.0 License at
https://source.collectionspace.org/collection-space/LICENSE.txt
*/

var bampfa = {};

(function ($, fluid) {

	bampfa.computeAccessionNumber = function() {
		var parts = [];
		
		for(var i=0; i<arguments.length; i++) {
			var arg = arguments[i];
			var part = normalizeAccessionNumberPart(arg);
			
			if (part != "") {
				parts.push(normalizeAccessionNumberPart(part));
			}
		}
		
		return parts.join(".");
	};
	
	var normalizeAccessionNumberPart = function(part) {
		var normalizedPart = "";
		
		if (typeof(part) != "undefined" && part != null) {
			normalizedPart = $.trim(part);
		}
		
		return normalizedPart;
	}
	
	bampfa.computeDimensionSummary = function(measuredPart, dimensionSubGroup, measuredPartNote) {
		var valueMap = {};
		
		for (var i=0; i<dimensionSubGroup.length; i++) {
			var measurement = dimensionSubGroup[i];
			var dimension = measurement.dimension;
			var value = measurement.value;
			var unit = measurement.measurementUnit;
			
			if ((unit == "inches" || unit == "centimeters") && value != null && value != "" && !(dimension in valueMap)) {
				valueMap[dimension] = value;
			}
		}
		
		var orderedDimensions = ["height", "width", "depth", "diameter"];
		var orderedValues = [];
		
		for (var i=0; i<orderedDimensions.length; i++) {
			var dimension = orderedDimensions[i];
			
			if (dimension in valueMap) {
				orderedValues.push(valueMap[dimension]);
			}
		}
		
		var dimensionSummary = orderedValues.join(" x ");
		var summaryParts = [];
		
		if (measuredPart != null && measuredPart != "") {
			summaryParts.push(measuredPart + ":");
		}

		if (dimensionSummary != "") {
			summaryParts.push(dimensionSummary);
		}
		
		if (measuredPartNote != null && measuredPartNote != "") {
			summaryParts.push("(" + measuredPartNote + ")");
		}
		
		return summaryParts.join(" ");
	}

	bampfa.computeFullNameLFM = function(foreName, middleName, surName, nameAdditions, nationalities) {
		var nameParts = [];

		foreName = jQuery.trim(foreName);
		middleName = jQuery.trim(middleName);
		surName = jQuery.trim(surName);
		nameAdditions = jQuery.trim(nameAdditions);

		var nationality = "";
		
		if (nationalities.length > 0) {
			for (var i=0; i<nationalities.length; i++) {
				var candidateNationality = nationalities[i];
				
				if (candidateNationality["_primary"]) {
					nationality = jQuery.trim(candidateNationality.nationality);
					break;
				}
			}
		}
	
		if (surName.toLowerCase() == "unknown") {
			nameParts.push(surName);
			
			if (nationality) {
				nameParts.push("(" + nationality + ")");
			}
		}
		else if (!foreName && !surName) {
			// The calculation function from FileMaker outputs "??" if both first name and last name are empty.
			// As a simplification, I'm making the output empty in this case. See BAMPFA-205 and BAMPFA-238
			// for details.
			
			// nameParts.push("??");
		}
		else if (!surName) {
			nameParts.push(foreName);
		}
		else if (!foreName) {
			nameParts.push(surName);
		}
		else if (!middleName) {
			if (nationality.toLowerCase().indexOf("china") < 0) {
				surName = surName + ",";
			}
			
			nameParts.push(surName);
			
			if (nameAdditions) {
				foreName = foreName + ",";
			}
			
			nameParts.push(foreName);
			
			if (nameAdditions) {
				nameParts.push(nameAdditions);
			}
		}
		else {
			if (nationality.toLowerCase().indexOf("china") < 0) {
				surName = surName + ",";
			}
			
			nameParts.push(surName);
			nameParts.push(foreName);
			
			if (nameAdditions) {
				middleName = middleName + ",";
			}
			
			nameParts.push(middleName);
			
			if (nameAdditions) {
				nameParts.push(nameAdditions);
			}
		}
		
		return nameParts.join(" ");
	}
	
	bampfa.computeFullNameFML = function(title, foreName, middleName, surName, nameAdditions, nationalities) {
		var nameParts = [];
		
		title = jQuery.trim(title);
		foreName = jQuery.trim(foreName);
		middleName = jQuery.trim(middleName);
		surName = jQuery.trim(surName);
		nameAdditions = jQuery.trim(nameAdditions);

		var nationality = "";
		
		if (nationalities.length > 0) {
			for (var i=0; i<nationalities.length; i++) {
				var candidateNationality = nationalities[i];
				
				if (candidateNationality["_primary"]) {
					nationality = jQuery.trim(candidateNationality.nationality);
					break;
				}
			}
		}
		
		if (surName.toLowerCase() == "unknown") {
			nameParts.push(surName);

			if (nationality) {
				nameParts.push("(" + nationality + ")");
			}
		}
		else {
			if (title) {
				nameParts.push(title);
			}
			
			if (foreName) {
				nameParts.push(foreName);
			}
			
			if (middleName) {
				nameParts.push(middleName);
			}
			
			if (surName) {
				nameParts.push(surName);
			}
			
			if (nameAdditions) {
				nameParts.push(nameAdditions);
			}			
		}
		
		return nameParts.join(" ");
	}
	
	/* 
	 * Convert html from the richTextEditor component into plain text.
	 */
	bampfa.convertHtmlToPlainText = function(html) {
		var lines = html.split("<br />");
		var plainTextLines = [];
		
		for (var i=0; i<lines.length; i++) {
			var line = lines[i].replace(/&nbsp;/g, " ");
			var element = $("<div>" + line + "</div>");
			
			plainTextLines.push(element.text());
		}
		
		return plainTextLines.join("\n");
	}
	
	
	var zeroPad = function(str, len){
		if (str.length >= len) {
			return (str);
		}
		
		return (new Array(len + 1).join('0') + str).slice(-len);
	};
	
	var isNumericRegExp = /^\d+$/;
	
	bampfa.computeSortableObjectNumber = function(objectNumber) {
		var parts = objectNumber.split('.');
		var sortableParts = [];
		
		for (var i=0; i<parts.length; i++) {
			var part = parts[i];
			
			if (isNumericRegExp.test(part)) {
				part = zeroPad(part, 5);
			}
			else {
				part = part.toLowerCase();
			}
			
			sortableParts.push(part);
		}
		
		return sortableParts.join(' ');
	}
})(jQuery, fluid);