package controllers;

import java.util.*;

import models.*;
import play.*;
import play.mvc.*;
import play.mvc.Scope.Params;
import play.utils.*;

public class Sync extends Controller {
	public static void index() {
		List<Fact> facts = Fact.all().fetch();
		List<HiFact> hiFacts = HiFact.all().fetch();
		// List<LastSync> lastSyncs = LastSync.all().fetch();

		render(facts, hiFacts);
	}

	public static void handle(List<String> facts) {
		handleFacts(facts);
		index();
	}

	public static void recompute() {
		HiFact.deleteAll();
		for (Fact fact : Fact.all().<Fact> fetch()) {
			handleHiFact(new HiFact(fact.fact));
		}

		index();
	}

	public static void sync(String owner, long sequence) {
		List<String> facts = params.getAll("facts[]") != null ? Arrays.asList(params.getAll("facts[]")) : null;
		if (facts != null) {
			handleFacts(facts);
		}

		long newSequence = new Date().getTime();
		List<HiFact> hiFacts = HiFact.find("sequence >= ?", sequence).fetch();
		List<String> returnFacts = new LinkedList<String>();
		for (HiFact hiFact : hiFacts) {
			returnFacts.add(hiFact.toFact());
		}

		renderJSON(Arrays.asList(newSequence, returnFacts));
	}

	private static void handleFacts(List<String> facts) {
		for (String fact : facts) {
			handleFact(fact);
			handleHiFact(new HiFact(fact));
		}
	}

	private static void handleFact(String fact) {
		if (Fact.count("fact = ?", fact) == 0) {
			Fact newFact = new Fact();
			newFact.fact = fact;
			newFact.save();
		}
	}

	private static void handleHiFact(HiFact hiFact) {
		HiFact oldHiFact = HiFact.find("owner = ? and item = ? and property = ?", hiFact.owner, hiFact.item, hiFact.property).first();
		if (oldHiFact != null) {
			if (hiFact.timestamp.after(oldHiFact.timestamp)) {
				// replace value and timestamp of existing entry
				// owner-item-property
				oldHiFact.value = hiFact.value;
				oldHiFact.timestamp = hiFact.timestamp;
				oldHiFact.sequence = new Date().getTime();
				oldHiFact.save();
			}
		} else {
			// add new entry owner-item-property
			hiFact.sequence = new Date().getTime();
			hiFact.save();
		}
	}
}
