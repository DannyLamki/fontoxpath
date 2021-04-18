/**
 * The widget class
 * @public
 */
export default class LakmiGreeting {
    public msg: string;

	constructor(msg: string) {
		this.msg = msg;
	}

	public greet() {
		console.log("Lakmi say: " + this.msg);
	}
}