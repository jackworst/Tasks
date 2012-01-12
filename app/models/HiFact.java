package models;

import java.util.*;

import javax.persistence.*;

import play.db.jpa.*;

@Entity
public class HiFact extends Model {
	public String owner;
	public String item;
	public String property;
	public Date timestamp;
	public long sequence;

	@Column(columnDefinition = "TEXT")
	public String value;

	public HiFact() {
	}

	public HiFact(String fact) {
		int eq = fact.indexOf("=");
		int at = fact.indexOf("@");
		String[] keyTokens = fact.substring(0, at).split("-");

		this.owner = keyTokens[0];
		this.item = keyTokens[1];
		this.property = keyTokens[2];
		this.timestamp = new Date(Long.parseLong(fact.substring(at + 1, eq)));
		this.value = fact.substring(eq + 1, fact.length());
	}

	public String toFact() {
		return owner + "-" + item + "-" + property + "@" + timestamp.getTime() + "=" + value;
	}
}
